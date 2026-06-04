// Curated list of common SMB NAICS 6-digit codes for the discovery
// "Industry (NAICS)" picker. Not the exhaustive ~1,000-code census list —
// a practical set covering the industries advisors most often see, kept
// small enough to ship in the client bundle for the searchable dropdown.
// The stored value is the 6-digit code string; financials/valuation read
// it as-is.

export type NaicsEntry = { code: string; title: string };

export const NAICS: NaicsEntry[] = [
  // Construction & specialty trades
  { code: "236115", title: "New Single-Family Housing Construction" },
  { code: "236118", title: "Residential Remodelers" },
  { code: "236220", title: "Commercial & Institutional Building Construction" },
  { code: "237310", title: "Highway, Street & Bridge Construction" },
  { code: "238110", title: "Poured Concrete Foundation & Structure Contractors" },
  { code: "238160", title: "Roofing Contractors" },
  { code: "238210", title: "Electrical Contractors" },
  { code: "238220", title: "Plumbing, Heating & Air-Conditioning Contractors" },
  { code: "238310", title: "Drywall & Insulation Contractors" },
  { code: "238320", title: "Painting & Wall Covering Contractors" },
  { code: "238330", title: "Flooring Contractors" },
  { code: "238350", title: "Finish Carpentry Contractors" },
  { code: "238910", title: "Site Preparation Contractors" },
  { code: "238990", title: "All Other Specialty Trade Contractors" },

  // Manufacturing
  { code: "311811", title: "Retail Bakeries" },
  { code: "321911", title: "Wood Window & Door Manufacturing" },
  { code: "323111", title: "Commercial Printing (except Screen & Books)" },
  { code: "332710", title: "Machine Shops" },
  { code: "332996", title: "Fabricated Pipe & Pipe Fitting Manufacturing" },
  { code: "333517", title: "Machine Tool Manufacturing" },
  { code: "337110", title: "Wood Kitchen Cabinet & Countertop Manufacturing" },
  { code: "339950", title: "Sign Manufacturing" },

  // Wholesale
  { code: "423330", title: "Roofing, Siding & Insulation Material Wholesalers" },
  { code: "423510", title: "Metal Service Centers & Other Metal Wholesalers" },
  { code: "423730", title: "HVAC Equipment & Supplies Wholesalers" },
  { code: "424410", title: "General Line Grocery Wholesalers" },

  // Retail
  { code: "441110", title: "New Car Dealers" },
  { code: "441120", title: "Used Car Dealers" },
  { code: "441310", title: "Automotive Parts & Accessories Stores" },
  { code: "442110", title: "Furniture Stores" },
  { code: "442210", title: "Floor Covering Stores" },
  { code: "443142", title: "Electronics Stores" },
  { code: "444110", title: "Home Centers" },
  { code: "444130", title: "Hardware Stores" },
  { code: "444210", title: "Outdoor Power Equipment Stores" },
  { code: "445110", title: "Supermarkets & Other Grocery Stores" },
  { code: "446110", title: "Pharmacies & Drug Stores" },
  { code: "448140", title: "Family Clothing Stores" },
  { code: "451110", title: "Sporting Goods Stores" },
  { code: "453110", title: "Florists" },
  { code: "453910", title: "Pet & Pet Supplies Stores" },

  // Transportation & warehousing
  { code: "484110", title: "General Freight Trucking, Local" },
  { code: "484121", title: "General Freight Trucking, Long-Distance (Truckload)" },
  { code: "493110", title: "General Warehousing & Storage" },

  // Professional, scientific & technical services
  { code: "541110", title: "Offices of Lawyers" },
  { code: "541211", title: "Offices of Certified Public Accountants" },
  { code: "541310", title: "Architectural Services" },
  { code: "541330", title: "Engineering Services" },
  { code: "541350", title: "Building Inspection Services" },
  { code: "541380", title: "Testing Laboratories" },
  { code: "541410", title: "Interior Design Services" },
  { code: "541511", title: "Custom Computer Programming Services" },
  { code: "541512", title: "Computer Systems Design Services" },
  { code: "541611", title: "Administrative & General Management Consulting" },
  { code: "541613", title: "Marketing Consulting Services" },
  { code: "541618", title: "Other Management Consulting Services" },
  { code: "541810", title: "Advertising Agencies" },
  { code: "541921", title: "Photography Studios, Portrait" },
  { code: "541990", title: "All Other Professional & Technical Services" },

  // Administrative & support services
  { code: "561110", title: "Office Administrative Services" },
  { code: "561320", title: "Temporary Help Services" },
  { code: "561612", title: "Security Guards & Patrol Services" },
  { code: "561720", title: "Janitorial Services" },
  { code: "561730", title: "Landscaping Services" },
  { code: "561740", title: "Carpet & Upholstery Cleaning Services" },

  // Finance, insurance & real estate
  { code: "522110", title: "Commercial Banking" },
  { code: "523930", title: "Investment Advice" },
  { code: "524210", title: "Insurance Agencies & Brokerages" },
  { code: "531210", title: "Offices of Real Estate Agents & Brokers" },
  { code: "531311", title: "Residential Property Managers" },

  // Health care
  { code: "621111", title: "Offices of Physicians" },
  { code: "621210", title: "Offices of Dentists" },
  { code: "621310", title: "Offices of Chiropractors" },
  { code: "621320", title: "Offices of Optometrists" },
  { code: "621340", title: "Offices of Physical & Occupational Therapists" },
  { code: "621610", title: "Home Health Care Services" },
  { code: "623110", title: "Nursing Care Facilities (Skilled Nursing)" },
  { code: "624410", title: "Child Day Care Services" },

  // Education & recreation
  { code: "611620", title: "Sports & Recreation Instruction" },
  { code: "713940", title: "Fitness & Recreational Sports Centers" },

  // Food service
  { code: "722410", title: "Drinking Places (Alcoholic Beverages)" },
  { code: "722511", title: "Full-Service Restaurants" },
  { code: "722513", title: "Limited-Service Restaurants" },
  { code: "722515", title: "Snack & Nonalcoholic Beverage Bars" },

  // Repair & personal services
  { code: "811111", title: "General Automotive Repair" },
  { code: "811121", title: "Automotive Body, Paint & Interior Repair" },
  { code: "811192", title: "Car Washes" },
  { code: "812112", title: "Beauty Salons" },
  { code: "812210", title: "Funeral Homes & Funeral Services" },
  { code: "812320", title: "Drycleaning & Laundry Services" },
];

const BY_CODE = new Map(NAICS.map((n) => [n.code, n.title]));

// "238330 — Flooring Contractors" for a known code, the raw value for an
// unrecognized one (e.g. a code typed before this picker existed), or ""
// when nothing is selected.
export function naicsLabel(code: string | null | undefined): string {
  if (!code) return "";
  const title = BY_CODE.get(code);
  return title ? `${code} — ${title}` : code;
}

export function searchNaics(query: string, limit = 60): NaicsEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return NAICS.slice(0, limit);
  const out: NaicsEntry[] = [];
  for (const n of NAICS) {
    if (n.code.includes(q) || n.title.toLowerCase().includes(q)) {
      out.push(n);
      if (out.length >= limit) break;
    }
  }
  return out;
}
