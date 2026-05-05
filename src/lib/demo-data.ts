import areaMaster from "@/data/areas.json";
import { buildMonthRecords, getMonthMeta, type CalendarStatus } from "@/lib/calendar";

export type DemoCustomer = {
  id: string;
  name: string;
  areaCode: string;
  areaName: string;
  area: string;
  address: string;
  phone: string;
  quantity: number;
  quantityLabel: string;
  rate: number;
  due: number;
  paid: number;
  billed: number;
  status: "ACTIVE" | "PAUSED" | "INACTIVE";
  notes: string;
  deliverySlot: "Morning" | "Evening";
};

export type DemoArea = {
  code: string;
  name: {
    en: string;
    hi: string;
    pa: string;
  };
};

export const demoAreas: DemoArea[] = areaMaster;

export const demoCustomers: DemoCustomer[] = [
  {
    id: "amit-verma",
    name: "Amit Verma",
    areaCode: "YAMUNA_APPARTMENT",
    areaName: "Yamuna Appartment",
    area: "Yamuna Appartment",
    address: "Flat 12, Yamuna Appartment, Near Hanuman Mandir",
    phone: "+91 98765 43210",
    quantity: 2,
    quantityLabel: "2.0 L",
    rate: 62,
    due: 820,
    paid: 3020,
    billed: 3840,
    status: "ACTIVE",
    notes: "Leave steel can near the side gate on Sundays.",
    deliverySlot: "Morning",
  },
  {
    id: "neha-sharma",
    name: "Neha Sharma",
    areaCode: "GILCO_APPARTMENT",
    areaName: "Gilco Appartment",
    area: "Gilco Appartment",
    address: "Tower B, Gilco Appartment, Opp. City Clinic",
    phone: "+91 98111 22334",
    quantity: 1.5,
    quantityLabel: "1.5 L",
    rate: 64,
    due: 0,
    paid: 2880,
    billed: 2880,
    status: "ACTIVE",
    notes: "Customer prefers digital invoices over WhatsApp.",
    deliverySlot: "Morning",
  },
  {
    id: "rakesh-kumar",
    name: "Rakesh Kumar",
    areaCode: "SHIVALIK_CITY",
    areaName: "Shivalik City",
    area: "Shivalik City",
    address: "88 Shivalik City, Back lane entrance",
    phone: "+91 98989 44455",
    quantity: 2.5,
    quantityLabel: "2.5 L",
    rate: 60,
    due: 1450,
    paid: 3200,
    billed: 4650,
    status: "PAUSED",
    notes: "Pause evening can if family is out of town.",
    deliverySlot: "Morning",
  },
];

export const demoDeliveries = [
  {
    customerId: "amit-verma",
    customerName: "Amit Verma",
    quantityLabel: "2.0 L",
    status: "Delivered",
    note: "Payment reminder required",
    route: "Yamuna Appartment",
    areaCode: "YAMUNA_APPARTMENT",
    eta: "06:20 AM",
  },
  {
    customerId: "neha-sharma",
    customerName: "Neha Sharma",
    quantityLabel: "1.5 L",
    status: "Pending",
    note: "Ring bell once, no doorstep knock",
    route: "Gilco Appartment",
    areaCode: "GILCO_APPARTMENT",
    eta: "06:35 AM",
  },
  {
    customerId: "rakesh-kumar",
    customerName: "Rakesh Kumar",
    quantityLabel: "2.5 L",
    status: "Pending",
    note: "Confirm resume request before delivery",
    route: "Shivalik City",
    areaCode: "SHIVALIK_CITY",
    eta: "06:55 AM",
  },
];

export const demoPayments = [
  {
    id: "pmt-1001",
    customerId: "amit-verma",
    customerName: "Amit Verma",
    amount: 1200,
    mode: "UPI",
    date: "14 Apr 2026",
    note: "Partial monthly payment",
  },
  {
    id: "pmt-1002",
    customerId: "neha-sharma",
    customerName: "Neha Sharma",
    amount: 2880,
    mode: "Bank",
    date: "11 Apr 2026",
    note: "Month cleared",
  },
  {
    id: "pmt-1003",
    customerId: "rakesh-kumar",
    customerName: "Rakesh Kumar",
    amount: 800,
    mode: "Cash",
    date: "09 Apr 2026",
    note: "Collected on route",
  },
];

export function getDemoCustomerById(customerId: string) {
  return demoCustomers.find((customer) => customer.id === customerId);
}

export function getAreaAnalytics() {
  return demoAreas.map((area) => {
    const areaCustomers = demoCustomers.filter((customer) => customer.areaCode === area.code);

    return {
      ...area,
      customerCount: areaCustomers.length,
      dailyConsumption: areaCustomers.reduce(
        (total, customer) => total + customer.quantity,
        0,
      ),
      monthlyBilled: areaCustomers.reduce((total, customer) => total + customer.billed, 0),
      dueAmount: areaCustomers.reduce((total, customer) => total + customer.due, 0),
    };
  });
}

const calendarBase = {
  year: 2026,
  month: 4,
};

function resolveCustomerStatus(customer: DemoCustomer, date: Date): CalendarStatus {
  const day = date.getUTCDate();
  const weekday = date.getUTCDay();

  if (customer.status === "PAUSED" && (weekday === 0 || day % 4 === 0)) {
    return "PAUSED";
  }

  if (weekday === 0 || day === 14) {
    return "SKIPPED";
  }

  return "DELIVERED";
}

export function getCustomerCalendarInsights(customerId: string) {
  const customer = getDemoCustomerById(customerId) || demoCustomers[0];
  const monthMeta = getMonthMeta(calendarBase);
  const days = buildMonthRecords(calendarBase, (date) => {
    const status = resolveCustomerStatus(customer, date);
    const liters = status === "DELIVERED" ? customer.quantity : 0;

    return {
      liters,
      status,
    };
  });

  const deliveredDays = days.filter((day) => day.status === "DELIVERED").length;
  const skippedDays = days.filter((day) => day.status === "SKIPPED").length;
  const pausedDays = days.filter((day) => day.status === "PAUSED").length;
  const totalLiters = days.reduce((total, day) => total + day.liters, 0);

  return {
    customer,
    monthMeta,
    days,
    summary: {
      deliveredDays,
      skippedDays,
      pausedDays,
      totalLiters,
      estimatedBill: totalLiters * customer.rate,
    },
  };
}

export function getAdminCalendarInsights() {
  const monthMeta = getMonthMeta(calendarBase);
  const days = buildMonthRecords(calendarBase, (date) => {
    const snapshot = demoCustomers.map((customer) => {
      const status = resolveCustomerStatus(customer, date);

      return {
        customer,
        status,
      };
    });

    const deliveredCustomers = snapshot.filter((entry) => entry.status === "DELIVERED");
    const pausedCustomers = snapshot.filter((entry) => entry.status === "PAUSED");
    const skippedCustomers = snapshot.filter((entry) => entry.status === "SKIPPED");
    const totalLiters = deliveredCustomers.reduce(
      (total, entry) => total + entry.customer.quantity,
      0,
    );

    let status: CalendarStatus = "DELIVERED";

    if (!deliveredCustomers.length && pausedCustomers.length) {
      status = "PAUSED";
    } else if (!deliveredCustomers.length) {
      status = "SKIPPED";
    } else if (skippedCustomers.length > deliveredCustomers.length) {
      status = "SKIPPED";
    }

    return {
      liters: totalLiters,
      status,
    };
  });

  const areaBreakdown = getAreaAnalytics();
  const peakDay = [...days].sort((left, right) => right.liters - left.liters)[0];
  const totalLiters = days.reduce((total, day) => total + day.liters, 0);

  return {
    monthMeta,
    days,
    areaBreakdown,
    summary: {
      totalLiters,
      activeCustomers: demoCustomers.filter((customer) => customer.status === "ACTIVE").length,
      peakDay,
      totalRevenueEstimate: demoCustomers.reduce(
        (total, customer) => total + customer.rate * customer.quantity * 24,
        0,
      ),
    },
  };
}
