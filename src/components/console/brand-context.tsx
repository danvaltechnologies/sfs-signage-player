import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { brands, type Brand } from "@/lib/signage-data";

export const ALL_BRANDS_ID = "all";

/** Sundry Foods orange — the parent brand's identity color, also used by Sundry Food Services. */
export const SUNDRY_ORANGE = "#FE9F1A";

export const allBrandsWorkspace: Brand = {
  id: ALL_BRANDS_ID,
  name: "All Brands",
  screens: brands.reduce((sum, b) => sum + b.screens, 0),
  color: SUNDRY_ORANGE,
};

type BrandContextValue = {
  activeBrand: Brand;
  isAllBrands: boolean;
  setActiveBrandId: (id: string) => void;
  /** True when a record belongs to the active workspace (always true in All Brands mode). */
  inScope: (brandId: string) => boolean;
};

/** Safe fallback so a page never blank-screens if it renders outside the provider. */
const defaultValue: BrandContextValue = {
  activeBrand: allBrandsWorkspace,
  isAllBrands: true,
  setActiveBrandId: () => {},
  inScope: () => true,
};

const BrandContext = createContext<BrandContextValue>(defaultValue);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState<string>(ALL_BRANDS_ID);
  const value = useMemo(() => {
    const isAllBrands = activeBrandId === ALL_BRANDS_ID;
    const activeBrand = isAllBrands
      ? allBrandsWorkspace
      : (brands.find((b) => b.id === activeBrandId) ?? brands[0]!);
    return {
      activeBrand,
      isAllBrands,
      setActiveBrandId,
      inScope: (brandId: string) => isAllBrands || brandId === activeBrand.id,
    };
  }, [activeBrandId]);

  // Re-theme the whole console to the active brand's identity color. --accent and --primary
  // drive every "selected / primary action" surface app-wide (nav rail, CTA buttons, focus
  // rings, filter chips), so overriding them here is enough to recolor all of it at once.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--accent", value.activeBrand.color);
    root.setProperty("--primary", value.activeBrand.color);
  }, [value.activeBrand.color]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
