import { connectToDatabase } from "@/lib/db/connect";
import type { CalendarStatus } from "@/lib/calendar";
import { Area } from "@/models/area";
import { Delivery } from "@/models/delivery";
import { CustomerProfile } from "@/models/customer-profile";
import { DeliveryException } from "@/models/delivery-exception";
import { MilkEntry } from "@/models/milk-entry";
import { MilkPlan } from "@/models/milk-plan";
import { Payment } from "@/models/payment";
import { Product } from "@/models/product";
import { PurchaseEntry } from "@/models/purchase-entry";
import { User } from "@/models/user";
import { Vendor } from "@/models/vendor";

type PlainArea = {
  _id: string;
  code: string;
  name: {
    en: string;
    hi: string;
    pa: string;
  };
  isActive?: boolean;
  sortOrder?: number;
};

type PlainUser = {
  _id: string;
  name: string;
  phone: string;
  preferredLanguage?: string;
  status?: string;
};

type PlainCustomerProfile = {
  _id: string;
  userId: string;
  customerCode: string;
  addressLine1: string;
  addressLine2?: string;
  areaCode: string;
  areaName: string;
  landmark?: string;
  notes?: string;
  deliveryInstruction?: string;
  isActive?: boolean;
};

type PlainMilkPlan = {
  _id: string;
  customerId: string;
  quantityLiters: number;
  pricePerLiter: number;
  unitLabel?: string;
  isActive?: boolean;
  startDate: Date | string;
  endDate?: Date | string;
};

type PlainDeliveryException = {
  _id: string;
  customerId: string;
  date: Date | string;
  type: "SKIP" | "PAUSE";
};

type DeliveryRunStatus = "ALL" | "DELIVERED" | "SKIPPED" | "PAUSED" | "PENDING";

type PlainDelivery = {
  _id: string;
  customerId: string;
  date: Date | string;
  defaultQuantity: number;
  actualQuantity: number;
  extraQuantity?: number;
  status: "DELIVERED" | "SKIPPED" | "PAUSED";
  note?: string;
};

type DeliveryAddOnItem = {
  productCode?: string;
  productName?: string;
  quantity?: number;
};

type PlainPayment = {
  _id: string;
  customerId: string;
  amount: number;
  date: Date | string;
  mode: string;
  note?: string;
};

type PlainProduct = {
  _id: string;
  code: string;
  name: string;
  category: "MILK" | "DAIRY_ADDON" | "OTHER";
  unit: string;
  defaultRate: number;
  isActive?: boolean;
  sortOrder?: number;
};

type PlainVendor = {
  _id: string;
  code: string;
  name: string;
  phone?: string;
  defaultRate?: number;
  areaCode?: string;
  areaName?: string;
  notes?: string;
  isActive?: boolean;
  sortOrder?: number;
};

type PlainMilkEntry = {
  _id: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  date: Date | string;
  quantity: number;
  rate: number;
  total: number;
  status: "PAID" | "UNPAID";
};

type VendorSummaryAggregate = {
  _id: string;
  entryCount: number;
  totalMilkInward: number;
  totalAmount: number;
  totalPaid: number;
  totalUnpaid: number;
  unpaidEntries: number;
  averageSupply: number;
  lastPurchaseDate?: Date;
  lastQuantity?: number;
  lastRate?: number;
};

type PlainPurchase = {
  _id: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  productId: string;
  productCode: string;
  productName: string;
  productCategory: "MILK" | "DAIRY_ADDON" | "OTHER";
  unit: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  date: Date | string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  note?: string;
};

function toDate(value?: Date | string | null) {
  return value ? new Date(value) : null;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatDateLabel(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function mapById<T extends { _id: string }>(items: T[]) {
  return new Map(items.map((item) => [String(item._id), item]));
}

async function getVendorMilkSummaryMap() {
  await connectToDatabase();

  const results = await MilkEntry.aggregate<VendorSummaryAggregate>([
    {
      $sort: { date: -1, createdAt: -1 },
    },
    {
      $group: {
        _id: "$vendorCode",
        entryCount: { $sum: 1 },
        totalMilkInward: { $sum: "$quantity" },
        totalAmount: { $sum: "$total" },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ["$status", "PAID"] }, "$total", 0],
          },
        },
        totalUnpaid: {
          $sum: {
            $cond: [{ $eq: ["$status", "UNPAID"] }, "$total", 0],
          },
        },
        unpaidEntries: {
          $sum: {
            $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0],
          },
        },
        averageSupply: { $avg: "$quantity" },
        lastPurchaseDate: { $first: "$date" },
        lastQuantity: { $first: "$quantity" },
        lastRate: { $first: "$rate" },
      },
    },
  ]);

  return new Map(results.map((item) => [String(item._id), item]));
}

async function getReferenceDate() {
  await connectToDatabase();

  const [latestDelivery, latestPayment, latestPurchase, latestMilkEntry] = await Promise.all([
    DeliveryException.findOne().sort({ date: -1 }).lean<PlainDeliveryException | null>(),
    Payment.findOne().sort({ date: -1 }).lean<PlainPayment | null>(),
    PurchaseEntry.findOne().sort({ date: -1 }).lean<PlainPurchase | null>(),
    MilkEntry.findOne().sort({ date: -1 }).lean<PlainMilkEntry | null>(),
  ]);

  const candidateDates = [latestDelivery?.date, latestPayment?.date, latestPurchase?.date, latestMilkEntry?.date]
    .map((value) => toDate(value))
    .filter((value): value is Date => Boolean(value));

  if (!candidateDates.length) {
    return new Date();
  }

  return candidateDates.sort((left, right) => right.getTime() - left.getTime())[0];
}

async function getBaseData() {
  await connectToDatabase();
  const referenceDate = await getReferenceDate();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const todayStart = startOfDay(referenceDate);
  const todayEnd = endOfDay(referenceDate);

  const [areas, profiles, users, plans, exceptionsMonth, exceptionsToday, deliveriesToday, paymentsMonth, products, vendors, purchasesMonth] =
    await Promise.all([
      Area.find().sort({ sortOrder: 1, name: 1 }).lean<PlainArea[]>(),
      CustomerProfile.find().sort({ customerCode: 1 }).lean<PlainCustomerProfile[]>(),
      User.find().lean<PlainUser[]>(),
      MilkPlan.find({ isActive: true }).sort({ startDate: -1 }).lean<PlainMilkPlan[]>(),
      DeliveryException.find({ date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: -1 }).lean<PlainDeliveryException[]>(),
      DeliveryException.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean<PlainDeliveryException[]>(),
      Delivery.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean<any[]>(),
      Payment.find({ date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: -1 }).lean<PlainPayment[]>(),
      Product.find().sort({ sortOrder: 1, name: 1 }).lean<PlainProduct[]>(),
      Vendor.find().sort({ sortOrder: 1, name: 1 }).lean<PlainVendor[]>(),
      PurchaseEntry.find({ date: { $gte: monthStart, $lte: monthEnd } })
        .sort({ date: -1 })
        .lean<PlainPurchase[]>(),
    ]);

  return {
    now: new Date(),
    referenceDate,
    monthStart,
    monthEnd,
    todayStart,
    todayEnd,
    areas,
    profiles,
    users,
    plans,
    exceptionsMonth,
    exceptionsToday,
    deliveriesToday,
    paymentsMonth,
    products,
    vendors,
    purchasesMonth,
  };
}

function buildCustomerEntities(base: Awaited<ReturnType<typeof getBaseData>>) {
  const userMap = mapById(base.users);
  const plansByCustomer = new Map<string, PlainMilkPlan>();

  for (const plan of base.plans) {
    const key = String(plan.customerId);
    if (!plansByCustomer.has(key)) {
      plansByCustomer.set(key, plan);
    }
  }

  return base.profiles.map((profile) => {
    const user = userMap.get(String(profile.userId));
    const activePlan = plansByCustomer.get(String(profile._id));
    const monthExceptions = base.exceptionsMonth.filter(
      (exception) => String(exception.customerId) === String(profile._id),
    );
    const todayException =
      base.exceptionsToday.find((exception) => String(exception.customerId) === String(profile._id)) ||
      null;
    const payments = base.paymentsMonth.filter(
      (payment) => String(payment.customerId) === String(profile._id),
    );

    const skippedDays = monthExceptions.filter((entry) => entry.type === "SKIP").length;
    const pausedDays = monthExceptions.filter((entry) => entry.type === "PAUSE").length;
    const totalDays = daysInMonth(base.referenceDate);
    const billableDays = Math.max(totalDays - skippedDays - pausedDays, 0);
    const quantity = activePlan?.quantityLiters || 0;
    const rate = activePlan?.pricePerLiter || 0;
    const milkAmount = billableDays * quantity * rate;
    const addonAmount = 0;

    const paidAmount = payments.reduce((total, payment) => total + payment.amount, 0);
    const totalAmount = milkAmount + addonAmount;
    const dueAmount = Math.max(totalAmount - paidAmount, 0);
    const advanceAmount = Math.max(paidAmount - totalAmount, 0);
    const deliveredDays = billableDays;

    const lastPayment = payments.length > 0 
      ? [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    return {
      profile,
      user,
      activePlan,
      monthExceptions,
      todayException,
      payments: payments.map(p => ({
        id: String(p._id),
        amount: p.amount,
        date: p.date,
        dateLabel: formatDateLabel(p.date),
        mode: p.mode,
        note: p.note || "",
      })),
      totals: {
        milkAmount,
        addonAmount,
        totalAmount,
        paidAmount,
        dueAmount,
        advanceAmount,
        deliveredDays,
        skippedDays,
        pausedDays,
        totalDays,
        monthlyLiters: billableDays * quantity,
      },
      lastPayment: lastPayment ? {
        amount: lastPayment.amount,
        date: lastPayment.date,
        dateLabel: formatDateLabel(lastPayment.date),
        mode: lastPayment.mode,
      } : null,
    };
  });
}

export async function getCustomerListData() {
  const base = await getBaseData();
  const customerEntities = buildCustomerEntities(base);
  const deliveryMap = new Map(base.deliveriesToday.map((d) => [String(d.customerId), d]));

  return customerEntities
    .map((entry) => {
      const customerId = String(entry.profile._id);
      const delivery = deliveryMap.get(customerId);
      const deliveryStatus = delivery?.status || null;

      const monthDayCount = daysInMonth(base.referenceDate);
      const leadingBlankSlots = new Date(
        base.referenceDate.getFullYear(),
        base.referenceDate.getMonth(),
        1,
      ).getDay();

      const days = Array.from({ length: monthDayCount }, (_, index) => {
        const day = index + 1;
        const date = new Date(base.referenceDate.getFullYear(), base.referenceDate.getMonth(), day);
        const exception = entry.monthExceptions.find(
          (ex) => toDate(ex.date)?.toDateString() === date.toDateString(),
        ) || null;
        const liters = exception ? 0 : entry.activePlan?.quantityLiters ?? 0;

        return {
          dateKey: `${monthKey(base.referenceDate)}-${String(day).padStart(2, "0")}`,
          dateLabel: formatDateLabel(date),
          dayOfMonth: day,
          weekdayLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
          liters,
          status: (exception?.type === "PAUSE" ? "PAUSED" : exception?.type === "SKIP" ? "SKIPPED" : "DELIVERED") as CalendarStatus,
          isFuture: date.getTime() > base.now.getTime(),
        };
      });

      return {
        id: customerId,
        customerCode: entry.profile.customerCode,
        name: entry.user?.name || entry.profile.customerCode,
        phone: entry.user?.phone || "",
        areaCode: entry.profile.areaCode,
        areaName: entry.profile.areaName,
        address: [entry.profile.addressLine1, entry.profile.addressLine2, entry.profile.landmark]
          .filter(Boolean)
          .join(", "),
        quantityLabel: `${(entry.activePlan?.quantityLiters || 0).toFixed(1)} ${entry.activePlan?.unitLabel || "L"}`,
        quantity: entry.activePlan?.quantityLiters || 0,
        rate: entry.activePlan?.pricePerLiter || 0,
        due: entry.totals.dueAmount,
        advance: entry.totals.advanceAmount,
        billed: entry.totals.totalAmount,
        paid: entry.totals.paidAmount,
        notes: entry.profile.notes || "",
        deliveryInstruction: entry.profile.deliveryInstruction || "",
        deliverySlot: "Morning",
        deliveryStatus,
        extraQuantity: delivery?.extraQuantity || 0,
        lastPayment: entry.lastPayment,
        paymentHistory: entry.payments,
        status:
          entry.profile.isActive === false || entry.user?.status === "INACTIVE"
            ? "INACTIVE"
            : entry.todayException?.type === "PAUSE"
              ? "PAUSED"
              : "ACTIVE",
        calendarData: {
          monthLabel: new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
          }).format(base.referenceDate),
          leadingBlankSlots,
          days,
        }
      };
    })
    .sort((a, b) => b.due - a.due);
}

export async function getCustomerDetailData(identifier: string) {
  const customers = await getCustomerListData();
  const customer = customers.find(
    (entry) => entry.customerCode === identifier || entry.id === identifier
  );

  if (!customer) {
    return null;
  }

  const base = await getBaseData();
  const entity = buildCustomerEntities(base).find(
    (entry) => entry.profile.customerCode === identifier || String(entry.profile._id) === identifier,
  );

  if (!entity) {
    return null;
  }

  return {
    ...customer,
    preferredLanguage: entity.user?.preferredLanguage || "en",
    addressLine1: entity.profile.addressLine1,
    addressLine2: entity.profile.addressLine2 || "",
    landmark: entity.profile.landmark || "",
    recentDeliveries: entity.monthExceptions.slice(0, 10).map((exception) => ({
      dateLabel: formatDateLabel(exception.date),
      status: exception.type === "PAUSE" ? "PAUSED" : "SKIPPED",
      finalQuantity: 0,
      extraQuantity: 0,
      addOnItems: [] as DeliveryAddOnItem[],
      note: "",
    })),
  };
}

export async function getDefaultCustomerCode() {
  const customers = await getCustomerListData();
  return customers[0]?.customerCode || null;
}

export async function getDashboardData() {
  const base = await getBaseData();
  const entities = buildCustomerEntities(base);

  const activeCustomers = entities.filter(
    (entry) => entry.profile.isActive !== false && entry.user?.status !== "INACTIVE",
  ).length;
  const todayExceptionCount = entities.filter((entry) => entry.todayException).length;
  const todayDelivered = Math.max(activeCustomers - todayExceptionCount, 0);
  const todayPending = 0;
  const monthlySales = entities.reduce((total, entry) => total + entry.totals.totalAmount, 0);
  const monthlyDue = entities.reduce((total, entry) => total + entry.totals.dueAmount, 0);

  const routeSnapshot = base.areas.map((area) => {
    const areaCustomers = entities.filter((entry) => entry.profile.areaCode === area.code);
    const delivered = areaCustomers.filter((entry) => !entry.todayException).length;

    return {
      areaCode: area.code,
      areaName: area.name,
      customerCount: areaCustomers.length,
      deliveredCount: delivered,
      liters: areaCustomers.reduce(
        (total, entry) =>
          total +
          (!entry.todayException ? entry.activePlan?.quantityLiters ?? 0 : 0),
        0,
      ),
    };
  });

  const attentionCustomers = entities
    .filter((entry) => entry.totals.dueAmount > 0 || entry.todayException)
    .slice(0, 6)
    .map((entry) => ({
      customerCode: entry.profile.customerCode,
      name: entry.user?.name || entry.profile.customerCode,
      info: `${(entry.activePlan?.quantityLiters || 0).toFixed(1)} L • ${entry.profile.areaName}`,
      issue:
        entry.totals.dueAmount > 0
          ? "Payment overdue"
          : entry.todayException?.type === "PAUSE"
            ? "Delivery paused"
            : "Delivery skipped",
      tone:
        entry.totals.dueAmount > 0
          ? "danger"
          : entry.todayException?.type === "PAUSE"
            ? "warning"
            : "blue",
    }));

  return {
    referenceDate: base.referenceDate,
    kpis: {
      activeCustomers,
      todayDelivered,
      todayPending,
      monthlySales,
      monthlyDue,
    },
    routeSnapshot,
    attentionCustomers,
  };
}

export async function getTodayDeliveriesData() {
  return getDeliveryRunData();
}

export async function getDeliveryRunData(options?: {
  date?: string;
  areaCode?: string;
  status?: DeliveryRunStatus;
}) {
  const base = await getBaseData();
  const entities = buildCustomerEntities(base);
  const targetDate = options?.date ? new Date(options.date) : new Date();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);
  const areaCode = options?.areaCode?.trim().toUpperCase();
  const statusFilter = options?.status || "ALL";
  const filteredEntities = areaCode
    ? entities.filter((entry) => entry.profile.areaCode === areaCode)
    : entities;
  const customerIds = filteredEntities.map((entry) => entry.profile._id);
  const [deliveries, exceptions] = await Promise.all([
    Delivery.find({
      customerId: { $in: customerIds },
      date: { $gte: dayStart, $lte: dayEnd },
    }).lean<PlainDelivery[]>(),
    DeliveryException.find({
      customerId: { $in: customerIds },
      date: { $gte: dayStart, $lte: dayEnd },
    }).lean<PlainDeliveryException[]>(),
  ]);

  const deliveryByCustomer = new Map(
    deliveries.map((delivery) => [String(delivery.customerId), delivery]),
  );
  const exceptionByCustomer = new Map(
    exceptions.map((exception) => [String(exception.customerId), exception]),
  );

  const entries = filteredEntities.map((entry) => {
    const customerKey = String(entry.profile._id);
    const delivery = deliveryByCustomer.get(customerKey);
    const exception = exceptionByCustomer.get(customerKey);
    const planQuantity = entry.activePlan?.quantityLiters || 0;
    const defaultQuantity = delivery?.defaultQuantity ?? planQuantity;
    const status: Exclude<DeliveryRunStatus, "ALL"> =
      delivery?.status ||
      (exception?.type === "PAUSE" ? "PAUSED" : exception?.type === "SKIP" ? "SKIPPED" : "PENDING");
    const actualQuantity =
      delivery?.actualQuantity ?? (status === "DELIVERED" ? planQuantity : 0);

    return {
      customerCode: entry.profile.customerCode,
      customerName: entry.user?.name || entry.profile.customerCode,
      quantityLabel: `${planQuantity.toFixed(1)} ${entry.activePlan?.unitLabel || "L"}`,
      status,
      deliveryInstruction: entry.profile.deliveryInstruction || "",
      route: entry.profile.areaName,
      areaCode: entry.profile.areaCode,
      dueAmount: entry.totals.dueAmount,
      defaultQuantity,
      extraQuantity: delivery?.extraQuantity || actualQuantity - defaultQuantity,
      actualQuantity,
      productItems: [],
    };
  });

  const STATUS_PRIORITY: Record<string, number> = {
    PENDING: 1,
    PAUSED: 2,
    SKIPPED: 3,
    DELIVERED: 4,
  };

  const sortedEntries = entries.sort((a, b) => {
    const pA = STATUS_PRIORITY[a.status] || 5;
    const pB = STATUS_PRIORITY[b.status] || 5;
    if (pA !== pB) return pA - pB;
    return a.customerName.localeCompare(b.customerName);
  });

  return statusFilter === "ALL"
    ? sortedEntries
    : sortedEntries.filter((entry) => entry.status === statusFilter);
}

export async function getBillingData() {
  const customers = await getCustomerListData();
  const base = await getBaseData();

  return {
    summary: {
      billedAmount: customers.reduce((total, customer) => total + customer.billed, 0),
      paidAmount: customers.reduce((total, customer) => total + customer.paid, 0),
      dueAmount: customers.reduce((total, customer) => total + customer.due, 0),
    },
    customers,
    recentPayments: (() => {
      const grouped = new Map<string, any>();
      
      for (const payment of base.paymentsMonth) {
        const customerId = String(payment.customerId);
        const date = new Date(payment.date);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString();
        const groupKey = `${customerId}_${dateKey}`;

        if (!grouped.has(groupKey)) {
          const profile = base.profiles.find((p) => String(p._id) === customerId);
          const customer = customers.find((c) => c.customerCode === profile?.customerCode);

          grouped.set(groupKey, {
            customerId,
            customerCode: customer?.customerCode || "",
            customerName: customer?.name || "Unknown",
            date,
            dateLabel: formatDateLabel(payment.date),
            totalAmount: 0,
            transactions: [],
          });
        }

        const group = grouped.get(groupKey);
        group.totalAmount += payment.amount;
        group.transactions.push({
          id: String(payment._id),
          amount: payment.amount,
          mode: payment.mode,
          note: payment.note || "",
        });
      }

      return Array.from(grouped.values()).slice(0, 30);
    })(),
  };
}

export async function getAreaAnalyticsData() {
  const base = await getBaseData();
  const entities = buildCustomerEntities(base);

  return base.areas.map((area) => {
    const areaCustomers = entities.filter((entry) => entry.profile.areaCode === area.code);

    return {
      code: area.code,
      name: area.name,
      customerCount: areaCustomers.length,
      dailyConsumption: areaCustomers.reduce(
        (total, entry) =>
          total +
          (!entry.todayException ? entry.activePlan?.quantityLiters ?? 0 : 0),
        0,
      ),
      monthlyConsumption: areaCustomers.reduce(
        (total, entry) => total + entry.totals.monthlyLiters,
        0,
      ),
      monthlyBilled: areaCustomers.reduce((total, entry) => total + entry.totals.totalAmount, 0),
      dueAmount: areaCustomers.reduce((total, entry) => total + entry.totals.dueAmount, 0),
    };
  });
}

export async function getAreasData() {
  const base = await getBaseData();
  return base.areas.map((area) => ({
    ...area,
    _id: String(area._id),
  }));
}

export async function getAdminCalendarData(filters?: {
  areaCode?: string;
  status?: string;
}) {
  const base = await getBaseData();
  let entities = buildCustomerEntities(base);

  if (filters?.areaCode) {
    entities = entities.filter((e) => e.profile.areaCode === filters.areaCode);
  }

  const referenceMonthKey = monthKey(base.referenceDate);
  const monthDayCount = daysInMonth(base.referenceDate);
  const leadingBlankSlots = new Date(
    base.referenceDate.getFullYear(),
    base.referenceDate.getMonth(),
    1,
  ).getDay();

  const dayRecords = Array.from({ length: monthDayCount }, (_, index) => {
    const day = index + 1;
    const date = new Date(base.referenceDate.getFullYear(), base.referenceDate.getMonth(), day);
    const entries = base.exceptionsMonth.filter(
      (exception) => toDate(exception.date)?.toDateString() === date.toDateString() &&
        (!filters?.areaCode || entities.some(e => String(e.profile._id) === String(exception.customerId)))
    );
    const pausedCount = entries.filter((entry) => entry.type === "PAUSE").length;
    const skippedCount = entries.filter((entry) => entry.type === "SKIP").length;
    const deliveredCount = Math.max(entities.length - pausedCount - skippedCount, 0);
    const exceptionCustomerIds = new Set(entries.map((entry) => String(entry.customerId)));
    const liters = entities.reduce(
      (total, entry) =>
        total +
        (!exceptionCustomerIds.has(String(entry.profile._id))
          ? entry.activePlan?.quantityLiters ?? 0
          : 0),
      0,
    );

    return {
      dateKey: `${referenceMonthKey}-${String(day).padStart(2, "0")}`,
      dateLabel: formatDateLabel(date),
      dayOfMonth: day,
      weekdayLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
      liters,
      status:
        pausedCount > 0
          ? "PAUSED"
          : skippedCount > 0
            ? "SKIPPED"
            : "DELIVERED" as CalendarStatus,
      deliveredCount,
      pausedCount,
      skippedCount,
    };
  });

  const areaBreakdown = await getAreaAnalyticsData();
  const peakDay = [...dayRecords].sort((left, right) => right.liters - left.liters)[0];

  return {
    monthMeta: {
      monthLabel: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(base.referenceDate),
      leadingBlankSlots,
    },
    days: dayRecords,
    areaBreakdown,
    summary: {
      totalLiters: dayRecords.reduce((total, day) => total + day.liters, 0),
      activeCustomers: (await getCustomerListData()).filter((entry) => entry.status === "ACTIVE")
        .length,
      peakDay,
      totalRevenueEstimate: areaBreakdown.reduce(
        (total, area) => total + area.monthlyBilled,
        0,
      ),
    },
  };
}

export async function getCustomerMonthlyCalendar(customerCode: string, month: number, year: number) {
  await connectToDatabase();
  const date = new Date(year, month - 1, 1);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const profiles = await CustomerProfile.find({ customerCode }).lean<PlainCustomerProfile[]>();
  if (!profiles.length) return null;
  const profile = profiles[0];
  const customerId = String(profile._id);

  const [exceptions, deliveries, plans] = await Promise.all([
    DeliveryException.find({ customerId, date: { $gte: monthStart, $lte: monthEnd } }).lean<PlainDeliveryException[]>(),
    Delivery.find({ customerId, date: { $gte: monthStart, $lte: monthEnd } }).lean<PlainDelivery[]>(),
    MilkPlan.find({ customerId, isActive: true }).sort({ startDate: -1 }).lean<PlainMilkPlan[]>(),
  ]);

  const activePlan = plans[0] || null;
  const monthDayCount = monthEnd.getDate();
  const leadingBlankSlots = monthStart.getDay();

  const days = Array.from({ length: monthDayCount }, (_, index) => {
    const dayNum = index + 1;
    const dayDate = new Date(year, month - 1, dayNum);
    const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    const exception = exceptions.find(ex => toDate(ex.date)?.toDateString() === dayDate.toDateString());
    const delivery = deliveries.find(d => toDate(d.date)?.toDateString() === dayDate.toDateString());
    
    let status: CalendarStatus = "PENDING";
    if (exception) {
      status = exception.type === "PAUSE" ? "PAUSED" : "SKIPPED";
    } else if (delivery) {
      status = delivery.status;
    }

    return {
      dateKey: dayKey,
      dayOfMonth: dayNum,
      weekdayLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(dayDate),
      status,
      liters: delivery ? delivery.actualQuantity : (exception ? 0 : activePlan?.quantityLiters ?? 0),
      isFuture: dayDate.getTime() > Date.now(),
    };
  });

  return {
    monthLabel: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date),
    leadingBlankSlots,
    days,
  };
}

export async function getCustomerCalendarData(customerCode?: string | null) {
  const base = await getBaseData();
  const customerId =
    customerCode || (await getDefaultCustomerCode()) || base.profiles[0]?.customerCode || "";
  const entity = buildCustomerEntities(base).find(
    (entry) => entry.profile.customerCode === customerId,
  );

  if (!entity) {
    return null;
  }

  const monthDayCount = daysInMonth(base.referenceDate);
  const leadingBlankSlots = new Date(
    base.referenceDate.getFullYear(),
    base.referenceDate.getMonth(),
    1,
  ).getDay();

  const days = Array.from({ length: monthDayCount }, (_, index) => {
    const day = index + 1;
    const date = new Date(base.referenceDate.getFullYear(), base.referenceDate.getMonth(), day);
    const entry =
      entity.monthExceptions.find(
        (exception) => toDate(exception.date)?.toDateString() === date.toDateString(),
      ) || null;
    const liters = entry ? 0 : entity.activePlan?.quantityLiters ?? 0;

    return {
      dateKey: `${monthKey(base.referenceDate)}-${String(day).padStart(2, "0")}`,
      dateLabel: formatDateLabel(date),
      dayOfMonth: day,
      weekdayLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
      liters,
      status: (entry?.type === "PAUSE" ? "PAUSED" : entry?.type === "SKIP" ? "SKIPPED" : "DELIVERED") as CalendarStatus,
      itemCount: 0,
    };
  });

  return {
    customerCode: entity.profile.customerCode,
    customer: {
      name: entity.user?.name || entity.profile.customerCode,
      areaName: entity.profile.areaName,
      quantityLabel: `${(entity.activePlan?.quantityLiters || 0).toFixed(1)} ${entity.activePlan?.unitLabel || "L"}`,
      rate: entity.activePlan?.pricePerLiter || 0,
    },
    monthMeta: {
      monthLabel: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(base.referenceDate),
      leadingBlankSlots,
    },
    days,
    summary: {
      totalLiters: days.reduce((total, day) => total + day.liters, 0),
      deliveredDays: days.filter((day) => day.status === "DELIVERED").length,
      skippedDays: days.filter((day) => day.status === "SKIPPED").length,
      pausedDays: days.filter((day) => day.status === "PAUSED").length,
      estimatedBill: entity.totals.totalAmount,
    },
  };
}

export async function getCustomerHistoryData(customerCode?: string | null) {
  const detail = await getCustomerDetailData(
    customerCode || (await getDefaultCustomerCode()) || "",
  );

  return detail?.recentDeliveries || [];
}

export async function getCustomerProfileData(customerCode?: string | null) {
  const detail = await getCustomerDetailData(
    customerCode || (await getDefaultCustomerCode()) || "",
  );

  if (!detail) {
    return null;
  }

  return {
    name: detail.name,
    phone: detail.phone,
    address: detail.address,
    preferredLanguage: detail.preferredLanguage,
    areaCode: detail.areaCode,
    areaName: detail.areaName,
  };
}

export async function getReportsData() {
  const areaAnalytics = await getAreaAnalyticsData();
  const billing = await getBillingData();
  const purchases = await getPurchaseLedgerData();

  return {
    areaAnalytics,
    summary: {
      collectionRate:
        billing.summary.billedAmount > 0
          ? Math.round((billing.summary.paidAmount / billing.summary.billedAmount) * 100)
          : 0,
      purchaseTotal: purchases.summary.totalPurchaseAmount,
      topArea:
        [...areaAnalytics].sort((left, right) => right.monthlyConsumption - left.monthlyConsumption)[0] ||
        null,
    },
  };
}

export async function getProductsData() {
  const base = await getBaseData();
  return base.products.map(p => ({
    ...p,
    _id: String(p._id)
  }));
}

export async function getVendorsData() {
  await connectToDatabase();
  const [vendors, summaryMap] = await Promise.all([
    Vendor.find().sort({ sortOrder: 1, name: 1 }).lean<PlainVendor[]>(),
    getVendorMilkSummaryMap(),
  ]);

  return vendors.map((vendor) => {
    const summary = summaryMap.get(vendor.code);

    return {
      _id: String(vendor._id),
      code: vendor.code,
      name: vendor.name,
      phone: vendor.phone ?? "",
      defaultRate: vendor.defaultRate ?? 0,
      areaCode: vendor.areaCode ?? "",
      areaName: vendor.areaName ?? "",
      notes: vendor.notes ?? "",
      isActive: vendor.isActive ?? true,
      sortOrder: vendor.sortOrder ?? 0,
      purchaseCount: summary?.entryCount ?? 0,
      totalPurchaseAmount: summary?.totalAmount ?? 0,
      totalPaid: summary?.totalPaid ?? 0,
      unpaidAmount: summary?.totalUnpaid ?? 0,
      totalMilkInward: summary?.totalMilkInward ?? 0,
      lastPurchaseDate: summary?.lastPurchaseDate
        ? formatDateLabel(summary.lastPurchaseDate)
        : "No entries",
      averageSupply: summary?.averageSupply ?? 0,
      unpaidEntries: summary?.unpaidEntries ?? 0,
      lastQuantity: summary?.lastQuantity ?? 0,
      lastRate: summary?.lastRate ?? vendor.defaultRate ?? 0,
    };
  });
}

export async function getMilkLedgerData(filters?: {
  vendorCode?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (filters?.vendorCode) {
    query.vendorCode = filters.vendorCode;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    query.date = {};

    if (filters?.dateFrom) {
      query.date = {
        ...(query.date as object),
        $gte: startOfDay(new Date(filters.dateFrom)),
      };
    }

    if (filters?.dateTo) {
      query.date = {
        ...(query.date as object),
        $lte: endOfDay(new Date(filters.dateTo)),
      };
    }
  }

  const entries = await MilkEntry.find(query)
    .sort({ date: -1, createdAt: -1 })
    .lean<PlainMilkEntry[]>();

  return {
    entries: entries.map((entry) => ({
      id: String(entry._id),
      vendorCode: entry.vendorCode,
      vendorName: entry.vendorName,
      date: new Date(entry.date).toISOString().slice(0, 10),
      dateLabel: formatDateLabel(entry.date),
      quantity: entry.quantity,
      rate: entry.rate,
      total: entry.total,
      status: entry.status,
    })),
    summary: {
      totalMilk: entries.reduce((total, entry) => total + entry.quantity, 0),
      totalAmount: entries.reduce((total, entry) => total + entry.total, 0),
      totalUnpaid: entries
        .filter((entry) => entry.status === "UNPAID")
        .reduce((total, entry) => total + entry.total, 0),
    },
  };
}

export async function getPurchaseLedgerData() {
  const base = await getBaseData();
  return {
    entries: base.purchasesMonth.map((entry) => ({
      id: String(entry._id),
      vendorCode: entry.vendorCode,
      vendorName: entry.vendorName,
      productCode: entry.productCode,
      productName: entry.productName,
      productCategory: entry.productCategory,
      unit: entry.unit,
      quantity: entry.quantity,
      rate: entry.rate,
      totalAmount: entry.totalAmount,
      paymentStatus: entry.paymentStatus,
      dateLabel: formatDateLabel(entry.date),
      note: entry.note || "",
    })),
    summary: {
      totalPurchaseAmount: base.purchasesMonth.reduce(
        (total, entry) => total + entry.totalAmount,
        0,
      ),
      totalPaid: base.purchasesMonth
        .filter((entry) => entry.paymentStatus === "PAID")
        .reduce((total, entry) => total + entry.totalAmount, 0),
      unpaidAmount: base.purchasesMonth
        .filter((entry) => entry.paymentStatus !== "PAID")
        .reduce((total, entry) => total + entry.totalAmount, 0),
      totalMilkInward: base.purchasesMonth
        .filter((entry) => entry.productCategory === "MILK")
        .reduce((total, entry) => total + entry.quantity, 0),
      averageSupply:
        new Set(
          base.purchasesMonth
            .filter((entry) => entry.productCategory === "MILK")
            .map((entry) => formatDateLabel(entry.date)),
        ).size > 0
          ? base.purchasesMonth
            .filter((entry) => entry.productCategory === "MILK")
            .reduce((total, entry) => total + entry.quantity, 0) /
          new Set(
            base.purchasesMonth
              .filter((entry) => entry.productCategory === "MILK")
              .map((entry) => formatDateLabel(entry.date)),
          ).size
          : 0,
      unpaidEntries: base.purchasesMonth.filter((entry) => entry.paymentStatus !== "PAID").length,
    },
  };
}

export async function getDeliveryOperationOptions() {
  const [customers, products] = await Promise.all([getCustomerListData(), getProductsData()]);

  return {
    customers,
    products: products.filter((product) => product.isActive !== false),
  };
}
export async function getCustomerByUserId(userId: string) {
  const base = await getBaseData();
  const entity = buildCustomerEntities(base).find(
    (entry) => String(entry.profile.userId) === userId
  );

  if (entity) {
    return getCustomerDetailData(entity.profile.customerCode);
  }

  // Fallback: Direct query if not found in base data (e.g. newly created)
  await connectToDatabase();
  const profile = await CustomerProfile.findOne({ userId }).lean<PlainCustomerProfile | null>();
  if (profile) {
    // If we found it directly, we should still return the full detail.
    // getCustomerDetailData will fetch getCustomerListData which might still be stale.
    // So we'll try to return a minimal valid object if it's really new.
    const detail = await getCustomerDetailData(profile.customerCode);
    if (detail) return detail;

    // Last resort: Build a minimal detail object for a new customer
    const user = await User.findById(userId).lean<PlainUser | null>();
    const plan = await MilkPlan.findOne({ customerId: profile._id, isActive: true }).lean<PlainMilkPlan | null>();
    
    return {
      id: String(profile._id),
      customerCode: profile.customerCode,
      name: user?.name || profile.customerCode,
      phone: user?.phone || "",
      areaCode: profile.areaCode,
      areaName: profile.areaName,
      address: [profile.addressLine1, profile.addressLine2, profile.landmark].filter(Boolean).join(", "),
      quantityLabel: `${(plan?.quantityLiters || 0).toFixed(1)} ${plan?.unitLabel || "L"}`,
      quantity: plan?.quantityLiters || 0,
      rate: plan?.pricePerLiter || 0,
      due: 0,
      billed: 0,
      paid: 0,
      notes: profile.notes || "",
      deliveryInstruction: profile.deliveryInstruction || "",
      deliverySlot: "Morning",
      deliveryStatus: "PENDING",
      extraQuantity: 0,
      lastPaymentDate: null,
      status: "ACTIVE",
      preferredLanguage: user?.preferredLanguage || "en",
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2 || "",
      landmark: profile.landmark || "",
      recentDeliveries: [],
      calendarData: {
        monthLabel: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date()),
        leadingBlankSlots: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay(),
        days: []
      }
    };
  }

  return null;
}
