import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { ApprovalKind, ApprovalState, Prisma } from "@prisma/client";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { assertBrandScope, brandScopeWhere } from "../../common/auth/permissions";
import type { AuthUser } from "../../common/auth/current-user.decorator";

const label: Record<ApprovalKind, string> = {
  MEDIA: "creative",
  PLAYLIST: "playlist",
  SCHEDULE: "campaign",
  ANNOUNCEMENT: "announcement",
};

/**
 * Every piece of content follows the same route: a content manager submits it,
 * a line manager (a role with canApprove) approves or sends it back. Nothing
 * can be published until its approval request is APPROVED.
 */
@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Applies the approval state back onto the underlying content row. */
  private async patchEntity(kind: ApprovalKind, entityId: string, state: ApprovalState) {
    const data = { approval: state } as never;
    if (kind === "MEDIA") return this.prisma.mediaAsset.update({ where: { id: entityId }, data });
    if (kind === "PLAYLIST") return this.prisma.playlist.update({ where: { id: entityId }, data });
    if (kind === "SCHEDULE") return this.prisma.schedule.update({ where: { id: entityId }, data });
    return this.prisma.announcement.update({ where: { id: entityId }, data });
  }

  async submit(
    user: AuthUser,
    input: { kind: ApprovalKind; entityId: string; brandId: string; title: string; note?: string },
  ) {
    assertBrandScope(user, input.brandId);

    const existing = await this.prisma.approvalRequest.findFirst({
      where: { kind: input.kind, entityId: input.entityId },
      orderBy: { submittedAt: "desc" },
    });
    if (existing?.state === "PENDING") {
      throw new BadRequestException("This item is already waiting for review");
    }

    const request = await this.prisma.approvalRequest.create({
      data: {
        kind: input.kind,
        entityId: input.entityId,
        brandId: input.brandId,
        title: input.title,
        state: "PENDING",
        note: input.note ?? null,
        submittedById: user.id,
      },
    });
    await this.patchEntity(input.kind, input.entityId, "PENDING");

    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: input.brandId,
      module: "approvals",
      action: "Submitted for approval",
      detail: `${user.name} submitted ${label[input.kind]} "${input.title}" for review`,
      category: "approvals",
      severity: "NOTICE",
      metadata: { kind: input.kind, entityId: input.entityId },
    });

    await this.notifications.notifyApprovers(input.brandId, {
      title: "New item waiting for your approval",
      body: `${user.name} submitted ${label[input.kind]} "${input.title}" for review.`,
      link: `/approvals?id=${request.id}`,
      category: "approvals",
      severity: "NOTICE",
      email: true,
    });

    return request;
  }

  async review(user: AuthUser, id: string, decision: "APPROVED" | "REJECTED", note?: string) {
    const request = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Approval request not found");
    assertBrandScope(user, request.brandId);
    if (request.state !== "PENDING") {
      throw new BadRequestException("This request has already been reviewed");
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        state: decision,
        note: note ?? request.note,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });
    await this.patchEntity(request.kind, request.entityId, decision);

    const approved = decision === "APPROVED";
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: request.brandId,
      module: "approvals",
      action: approved ? "Approved" : "Sent back",
      detail: `${user.name} ${approved ? "approved" : "sent back"} ${label[request.kind]} "${request.title}"${note ? ` — ${note}` : ""}`,
      category: "approvals",
      severity: approved ? "INFO" : "NOTICE",
      metadata: { kind: request.kind, entityId: request.entityId },
    });

    if (request.submittedById) {
      await this.notifications.notifyUsers([request.submittedById], {
        title: approved ? "Your submission was approved" : "Your submission was sent back",
        body: approved
          ? `${user.name} approved ${label[request.kind]} "${request.title}". It can now be scheduled or published.`
          : `${user.name} sent back ${label[request.kind]} "${request.title}".${note ? ` Note: ${note}` : ""}`,
        link: `/approvals?id=${request.id}`,
        category: "approvals",
        severity: approved ? "INFO" : "NOTICE",
        email: true,
      });
    }

    return updated;
  }

  list(user: AuthUser, filters: { brandId?: string; state?: ApprovalState; kind?: ApprovalKind }) {
    const where: Prisma.ApprovalRequestWhereInput = {
      ...brandScopeWhere(user, filters.brandId),
      ...(filters.state ? { state: filters.state } : {}),
      ...(filters.kind ? { kind: filters.kind } : {}),
    };
    return this.prisma.approvalRequest.findMany({
      where,
      orderBy: [{ state: "asc" }, { submittedAt: "desc" }],
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      take: 300,
    });
  }

  async pendingCount(user: AuthUser): Promise<number> {
    return this.prisma.approvalRequest.count({
      where: { state: "PENDING", ...brandScopeWhere(user) },
    });
  }

  /** Guard used before publishing: content must carry an APPROVED state. */
  async assertApproved(kind: ApprovalKind, entityId: string): Promise<void> {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { kind, entityId },
      orderBy: { submittedAt: "desc" },
    });
    if (request?.state !== "APPROVED") {
      throw new BadRequestException("This item must be approved by a line manager before it goes live");
    }
  }
}
