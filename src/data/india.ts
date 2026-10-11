export type StateMeta = {
  name: string;
  code: string;
  col: number;
  row: number;
};

/** Schematic tile positions — not a cadastral map and not an air-quality surface. */
export const INDIA_STATES: StateMeta[] = [
  { name: "Jammu and Kashmir", code: "JK", col: 4, row: 0 },
  { name: "Himachal Pradesh", code: "HP", col: 4, row: 1 },
  { name: "Punjab", code: "PB", col: 3, row: 1 },
  { name: "Uttarakhand", code: "UK", col: 5, row: 1 },
  { name: "Haryana", code: "HR", col: 3, row: 2 },
  { name: "Delhi", code: "DL", col: 4, row: 2 },
  { name: "Rajasthan", code: "RJ", col: 2, row: 3 },
  { name: "Uttar Pradesh", code: "UP", col: 5, row: 3 },
  { name: "Bihar", code: "BR", col: 6, row: 3 },
  { name: "Assam", code: "AS", col: 8, row: 3 },
  { name: "Gujarat", code: "GJ", col: 1, row: 4 },
  { name: "Madhya Pradesh", code: "MP", col: 3, row: 4 },
  { name: "Jharkhand", code: "JH", col: 6, row: 4 },
  { name: "West Bengal", code: "WB", col: 7, row: 4 },
  { name: "Maharashtra", code: "MH", col: 2, row: 5 },
  { name: "Chhattisgarh", code: "CT", col: 4, row: 5 },
  { name: "Odisha", code: "OD", col: 6, row: 5 },
  { name: "Telangana", code: "TS", col: 3, row: 6 },
  { name: "Andhra Pradesh", code: "AP", col: 4, row: 6 },
  { name: "Karnataka", code: "KA", col: 2, row: 7 },
  { name: "Tamil Nadu", code: "TN", col: 3, row: 7 },
  { name: "Kerala", code: "KL", col: 2, row: 8 },
];

export const STATE_WEIGHTS: Record<string, number> = {
  Maharashtra: 12,
  "Uttar Pradesh": 12,
  "Tamil Nadu": 9,
  Karnataka: 8,
  Gujarat: 8,
  Rajasthan: 6,
  "Madhya Pradesh": 5,
  "West Bengal": 5,
  Delhi: 5,
  Kerala: 4,
  Telangana: 4,
  "Andhra Pradesh": 4,
  Haryana: 4,
  Punjab: 3,
  Bihar: 3,
  Odisha: 2,
  Assam: 2,
  Jharkhand: 2,
  Chhattisgarh: 2,
  Uttarakhand: 1,
  "Himachal Pradesh": 1,
  "Jammu and Kashmir": 1,
};

export const STATE_RTOS: Record<string, string[]> = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Ghaziabad"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubballi"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
  Delhi: ["Delhi Central", "South Delhi", "West Delhi"],
  Kerala: ["Ernakulam", "Thiruvananthapuram", "Kozhikode"],
  Telangana: ["Hyderabad", "Warangal"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada"],
  Haryana: ["Gurugram", "Faridabad", "Hisar"],
  Punjab: ["Ludhiana", "Amritsar"],
  Bihar: ["Patna", "Gaya"],
  Odisha: ["Bhubaneswar", "Cuttack"],
  Assam: ["Guwahati"],
  Jharkhand: ["Ranchi", "Jamshedpur"],
  Chhattisgarh: ["Raipur"],
  Uttarakhand: ["Dehradun"],
  "Himachal Pradesh": ["Shimla"],
  "Jammu and Kashmir": ["Jammu", "Srinagar"],
};

export const STATE_NAMES = Object.keys(STATE_WEIGHTS);
