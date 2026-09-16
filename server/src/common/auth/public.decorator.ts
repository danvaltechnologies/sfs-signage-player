import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Marks a route as callable without a bearer token (login, POS webhook, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
