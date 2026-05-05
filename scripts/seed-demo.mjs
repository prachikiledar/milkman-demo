import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");
const areaDataPath = path.join(cwd, "src", "data", "areas.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getMonthDays(referenceDate) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const days = [];

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    days.push(new Date(current));
  }

  return days;
}

function toDayStart(date) {
  const next = new Date(date);
  next.setHours(6, 0, 0, 0);
  return next;
}

function buildCustomerSeed(areaMaster) {
  const firstNames = [
    "Amit", "Neha", "Rakesh", "Pooja", "Sanjay", "Kiran", "Deepak", "Nisha",
    "Vikas", "Anjali", "Manoj", "Komal", "Rahul", "Suman", "Arjun", "Preeti",
    "Vivek", "Meena", "Tarun", "Ritu", "Suresh", "Jyoti", "Aakash", "Mona",
    "Harish", "Simran", "Nitin", "Kajal", "Pradeep", "Seema", "Lokesh", "Tanya",
    "Gaurav", "Bhavna", "Rohit", "Shalini", "Mohit", "Renu", "Ankit", "Savita",
  ];
  const lastNames = [
    "Verma", "Sharma", "Kumar", "Bansal", "Gupta", "Arora", "Singh", "Yadav",
    "Chawla", "Aggarwal", "Joshi", "Mishra", "Saini", "Kohli", "Malhotra", "Jain",
    "Narang", "Bhardwaj", "Kapoor", "Mehra", "Puri", "Dhawan", "Saxena", "Goyal",
    "Ahuja", "Pathak", "Rana", "Tiwari", "Sethi", "Dua", "Walia", "Nagpal",
    "Bakshi", "Batra", "Sobti", "Talwar", "Bedi", "Sachdeva", "Kataria", "Lamba",
  ];
  const quantities = [1, 1.5, 2, 2.5, 3];
  const prices = [60, 62, 64, 66];
  const landmarks = [
    "Near Gate 1",
    "Opposite Park",
    "Near Temple Road",
    "Beside Dairy Booth",
    "Backside Market Lane",
  ];

  return Array.from({ length: 40 }, (_, index) => {
    const area = areaMaster[index % areaMaster.length];
    const name = `${firstNames[index]} ${lastNames[index]}`;
    const quantity = quantities[index % quantities.length];
    const pricePerLiter = prices[index % prices.length];

    return {
      customerCode: `MMK${String(index + 1).padStart(3, "0")}`,
      name,
      phone: `910000${String(index + 1).padStart(4, "0")}`,
      preferredLanguage: index % 3 === 0 ? "hi" : "en",
      quantityLiters: quantity,
      pricePerLiter,
      unitLabel: "L",
      areaCode: area.code,
      areaName: area.name.en,
      addressLine1: `House ${index + 11}, Block ${String.fromCharCode(65 + (index % 5))}`,
      addressLine2: `${area.name.en}, Kharar`,
      landmark: landmarks[index % landmarks.length],
      notes:
        index % 4 === 0
          ? "Ring once and leave at the main door"
          : index % 5 === 0
            ? "Extra milk sometimes required on weekends"
            : "Morning doorstep delivery",
    };
  });
}

async function seedDemoData() {
  loadEnvFile(envPath);

  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "milkman";

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI. Add it to .env.local before running the seed.");
  }

  const areaMaster = JSON.parse(fs.readFileSync(areaDataPath, "utf8"));
  const productMaster = [
    { code: "MILK_STANDARD", name: "Standard Milk", category: "MILK", unit: "L", defaultRate: 62, sortOrder: 1 },
    { code: "MILK_BUFFALO", name: "Buffalo Milk", category: "MILK", unit: "L", defaultRate: 68, sortOrder: 2 },
    { code: "GHEE_A2", name: "A2 Ghee", category: "DAIRY_ADDON", unit: "KG", defaultRate: 780, sortOrder: 3 },
    { code: "LASSI_FRESH", name: "Fresh Lassi", category: "DAIRY_ADDON", unit: "BOTTLE", defaultRate: 40, sortOrder: 4 },
    { code: "CURD_SET", name: "Set Curd", category: "DAIRY_ADDON", unit: "KG", defaultRate: 90, sortOrder: 5 },
    { code: "PANEER_FRESH", name: "Fresh Paneer", category: "DAIRY_ADDON", unit: "KG", defaultRate: 420, sortOrder: 6 },
  ];
  const vendorMaster = [
    { code: "VEND001", name: "Kharar Milk Traders", phone: "9200000001", areaCode: areaMaster[3].code, areaName: areaMaster[3].name.en, notes: "Primary morning milk supplier", sortOrder: 1 },
    { code: "VEND002", name: "Landra Dairy Supply", phone: "9200000002", areaCode: areaMaster[4].code, areaName: areaMaster[4].name.en, notes: "Bulk milk backup vendor", sortOrder: 2 },
    { code: "VEND003", name: "Gilco Dairy Foods", phone: "9200000003", areaCode: areaMaster[1].code, areaName: areaMaster[1].name.en, notes: "Supplies ghee, paneer, and curd", sortOrder: 3 },
    { code: "VEND004", name: "Shivalik Fresh Farms", phone: "9200000004", areaCode: areaMaster[2].code, areaName: areaMaster[2].name.en, notes: "Weekend special milk sourcing", sortOrder: 4 },
  ];
  const customerSeed = buildCustomerSeed(areaMaster);
  const referenceDate = toDayStart(new Date());
  const monthDays = getMonthDays(referenceDate);

  await mongoose.connect(mongoUri, {
    dbName,
    bufferCommands: false,
  });

  const db = mongoose.connection.db;
  const ObjectId = mongoose.Types.ObjectId;
  const areas = db.collection("areas");
  const users = db.collection("users");
  const customerProfiles = db.collection("customerprofiles");
  const milkPlans = db.collection("milkplans");
  const deliveries = db.collection("deliveries");
  const payments = db.collection("payments");
  const products = db.collection("products");
  const vendors = db.collection("vendors");
  const purchases = db.collection("purchaseentries");

  await Promise.all([
    areas.createIndex({ code: 1 }, { unique: true }),
    users.createIndex({ phone: 1 }, { unique: true }),
    customerProfiles.createIndex({ customerCode: 1 }, { unique: true }),
    products.createIndex({ code: 1 }, { unique: true }),
    vendors.createIndex({ code: 1 }, { unique: true }),
  ]);

  await areas.bulkWrite(
    areaMaster.map((area, index) => ({
      updateOne: {
        filter: { code: area.code },
        update: {
          $set: {
            code: area.code,
            name: area.name,
            isActive: true,
            sortOrder: index,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
  );

  await products.bulkWrite(
    productMaster.map((product) => ({
      updateOne: {
        filter: { code: product.code },
        update: {
          $set: {
            ...product,
            isActive: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
  );

  await vendors.bulkWrite(
    vendorMaster.map((vendor) => ({
      updateOne: {
        filter: { code: vendor.code },
        update: {
          $set: {
            ...vendor,
            isActive: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
  );

  await users.updateOne(
    { phone: "919876543210" },
    {
      $set: {
        role: "SUPER_ADMIN",
        name: {
          en: "Milkman Owner",
          hi: "मिल्कमैन ओनर",
          pa: "ਮਿਲਕਮੈਨ ਓਨਰ"
        },
        phone: "919876543210",
        email: "owner@milkman.local",
        passwordHash: "seeded-super-admin",
        preferredLanguage: "en",
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  for (const customer of customerSeed) {
    await users.updateOne(
      { phone: customer.phone },
      {
        $set: {
          role: "CUSTOMER",
          name: {
            en: customer.name,
            hi: customer.name, // Fallback to en for hi/pa in seed for now
            pa: customer.name
          },
          phone: customer.phone,
          passwordHash: "seeded-password",
          preferredLanguage: customer.preferredLanguage,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const seededUsers = await users
    .find({ phone: { $in: customerSeed.map((customer) => customer.phone) } })
    .toArray();
  const userByPhone = new Map(seededUsers.map((user) => [user.phone, user]));

  for (const customer of customerSeed) {
    const user = userByPhone.get(customer.phone);

    await customerProfiles.updateOne(
      { customerCode: customer.customerCode },
      {
        $set: {
          userId: user._id,
          customerCode: customer.customerCode,
          addressLine1: customer.addressLine1,
          addressLine2: customer.addressLine2,
          areaCode: customer.areaCode,
          areaName: customer.areaName,
          area: customer.areaName,
          landmark: customer.landmark,
          notes: customer.notes,
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const seededProfiles = await customerProfiles
    .find({ customerCode: { $in: customerSeed.map((customer) => customer.customerCode) } })
    .toArray();
  const profileByCode = new Map(seededProfiles.map((profile) => [profile.customerCode, profile]));

  await milkPlans.deleteMany({ customerId: { $in: seededProfiles.map((profile) => profile._id) } });
  await milkPlans.insertMany(
    customerSeed.map((customer) => ({
      customerId: profileByCode.get(customer.customerCode)._id,
      quantityLiters: customer.quantityLiters,
      pricePerLiter: customer.pricePerLiter,
      unitLabel: customer.unitLabel,
      startDate: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  const productDocs = await products.find({ code: { $in: productMaster.map((product) => product.code) } }).toArray();
  const productByCode = new Map(productDocs.map((product) => [product.code, product]));
  const vendorDocs = await vendors.find({ code: { $in: vendorMaster.map((vendor) => vendor.code) } }).toArray();
  const vendorByCode = new Map(vendorDocs.map((vendor) => [vendor.code, vendor]));

  await deliveries.deleteMany({ customerId: { $in: seededProfiles.map((profile) => profile._id) } });

  const deliveryDocs = [];
  const billedByCustomer = new Map();
  const dailyMilkLiters = new Map();

  for (const [index, customer] of customerSeed.entries()) {
    const profile = profileByCode.get(customer.customerCode);

    for (const day of monthDays) {
      let status = "DELIVERED";

      if ((day.getDate() + index) % 13 === 0) {
        status = "PAUSED";
      } else if ((day.getDate() + index) % 9 === 0) {
        status = "SKIPPED";
      }

      const extraQuantity =
        status === "DELIVERED"
          ? (day.getDate() + index) % 11 === 0
            ? 1
            : (day.getDate() + index) % 6 === 0
              ? 0.5
              : 0
          : 0;
      const finalQuantity = status === "DELIVERED" ? customer.quantityLiters + extraQuantity : 0;
      const items = [];

      if (status === "DELIVERED" && (day.getDate() + index) % 10 === 0) {
        const product = productByCode.get("LASSI_FRESH");
        items.push({
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          category: product.category,
          unit: product.unit,
          quantity: 2,
          rate: product.defaultRate,
          totalAmount: 2 * product.defaultRate,
        });
      }

      if (status === "DELIVERED" && (day.getDate() + index) % 17 === 0) {
        const product = productByCode.get("GHEE_A2");
        items.push({
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          category: product.category,
          unit: product.unit,
          quantity: 0.25,
          rate: product.defaultRate,
          totalAmount: roundTo(0.25 * product.defaultRate),
        });
      }

      if (status === "DELIVERED" && (day.getDate() + index) % 15 === 0) {
        const product = productByCode.get("CURD_SET");
        items.push({
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          category: product.category,
          unit: product.unit,
          quantity: 1,
          rate: product.defaultRate,
          totalAmount: product.defaultRate,
        });
      }

      deliveryDocs.push({
        _id: new ObjectId(),
        customerId: profile._id,
        date: toDayStart(day),
        quantityDelivered: finalQuantity,
        baseQuantity: customer.quantityLiters,
        extraQuantity,
        finalQuantity,
        pricePerLiter: customer.pricePerLiter,
        status,
        note:
          status === "PAUSED"
            ? "Customer paused delivery for the day"
            : status === "SKIPPED"
              ? "Household unavailable during route"
              : extraQuantity > 0
                ? "Extra milk recorded for the day"
                : customer.notes,
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const milkAmount = finalQuantity * customer.pricePerLiter;
      const addonAmount = items.reduce((total, item) => total + item.totalAmount, 0);
      billedByCustomer.set(
        customer.customerCode,
        roundTo((billedByCustomer.get(customer.customerCode) || 0) + milkAmount + addonAmount),
      );
      dailyMilkLiters.set(
        day.toDateString(),
        roundTo((dailyMilkLiters.get(day.toDateString()) || 0) + finalQuantity),
      );
    }
  }

  if (deliveryDocs.length) {
    await deliveries.insertMany(deliveryDocs);
  }

  await payments.deleteMany({ customerId: { $in: seededProfiles.map((profile) => profile._id) } });

  const paymentDocs = [];

  for (const [index, customer] of customerSeed.entries()) {
    const profile = profileByCode.get(customer.customerCode);
    const billed = billedByCustomer.get(customer.customerCode) || 0;
    const firstAmount = roundTo(billed * (0.45 + (index % 5) * 0.08));
    const secondAmount = index % 3 === 0 ? roundTo(billed * 0.18) : 0;

    if (firstAmount > 0) {
      paymentDocs.push({
        _id: new ObjectId(),
        customerId: profile._id,
        amount: Math.min(firstAmount, billed),
        date: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), Math.min(5 + (index % 7), referenceDate.getDate()), 11, 0, 0, 0),
        mode: index % 2 === 0 ? "UPI" : "CASH",
        note: "Seeded monthly collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (secondAmount > 0) {
      paymentDocs.push({
        _id: new ObjectId(),
        customerId: profile._id,
        amount: Math.min(secondAmount, Math.max(billed - firstAmount, 0)),
        date: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), Math.min(12 + (index % 5), referenceDate.getDate()), 18, 30, 0, 0),
        mode: index % 4 === 0 ? "BANK" : "UPI",
        note: "Seeded top-up payment",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (paymentDocs.length) {
    await payments.insertMany(paymentDocs.filter((payment) => payment.amount > 0));
  }

  await purchases.deleteMany({ vendorCode: { $in: vendorMaster.map((vendor) => vendor.code) } });

  const purchaseDocs = [];

  for (const [dayIndex, day] of monthDays.entries()) {
    const deliveredLiters = dailyMilkLiters.get(day.toDateString()) || 0;
    const primaryMilkQty = roundTo(deliveredLiters * 0.68 + 8);
    const secondaryMilkQty = roundTo(deliveredLiters * 0.42 + 4);
    const primaryVendor = vendorByCode.get(dayIndex % 2 === 0 ? "VEND001" : "VEND002");
    const secondaryVendor = vendorByCode.get(dayIndex % 2 === 0 ? "VEND004" : "VEND001");
    const standardMilk = productByCode.get("MILK_STANDARD");
    const buffaloMilk = productByCode.get("MILK_BUFFALO");

    purchaseDocs.push({
      _id: new ObjectId(),
      vendorId: primaryVendor._id,
      vendorCode: primaryVendor.code,
      vendorName: primaryVendor.name,
      productId: standardMilk._id,
      productCode: standardMilk.code,
      productName: standardMilk.name,
      productCategory: standardMilk.category,
      unit: standardMilk.unit,
      quantity: primaryMilkQty,
      rate: 52,
      totalAmount: roundTo(primaryMilkQty * 52),
      date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 4, 30, 0, 0),
      paymentStatus: dayIndex % 4 === 0 ? "UNPAID" : "PAID",
      note: "Morning inward milk purchase",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    purchaseDocs.push({
      _id: new ObjectId(),
      vendorId: secondaryVendor._id,
      vendorCode: secondaryVendor.code,
      vendorName: secondaryVendor.name,
      productId: buffaloMilk._id,
      productCode: buffaloMilk.code,
      productName: buffaloMilk.name,
      productCategory: buffaloMilk.category,
      unit: buffaloMilk.unit,
      quantity: secondaryMilkQty,
      rate: 56,
      totalAmount: roundTo(secondaryMilkQty * 56),
      date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 5, 15, 0, 0),
      paymentStatus: dayIndex % 5 === 0 ? "PARTIAL" : "PAID",
      note: "Supplementary milk purchase",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (dayIndex % 6 === 0) {
      const addOnVendor = vendorByCode.get("VEND003");
      const lassi = productByCode.get("LASSI_FRESH");
      const curd = productByCode.get("CURD_SET");

      purchaseDocs.push({
        _id: new ObjectId(),
        vendorId: addOnVendor._id,
        vendorCode: addOnVendor.code,
        vendorName: addOnVendor.name,
        productId: lassi._id,
        productCode: lassi.code,
        productName: lassi.name,
        productCategory: lassi.category,
        unit: lassi.unit,
        quantity: 24,
        rate: 28,
        totalAmount: 24 * 28,
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10, 0, 0, 0),
        paymentStatus: "PAID",
        note: "Weekly lassi stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      purchaseDocs.push({
        _id: new ObjectId(),
        vendorId: addOnVendor._id,
        vendorCode: addOnVendor.code,
        vendorName: addOnVendor.name,
        productId: curd._id,
        productCode: curd.code,
        productName: curd.name,
        productCategory: curd.category,
        unit: curd.unit,
        quantity: 6,
        rate: 62,
        totalAmount: 6 * 62,
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10, 30, 0, 0),
        paymentStatus: "PAID",
        note: "Weekly curd stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (purchaseDocs.length) {
    await purchases.insertMany(purchaseDocs);
  }

  console.log(`Seeded into "${dbName}"`);
  console.log(`- areas: ${areaMaster.length}`);
  console.log(`- products: ${productMaster.length}`);
  console.log(`- vendors: ${vendorMaster.length}`);
  console.log(`- customers: ${customerSeed.length}`);
  console.log(`- milk plans: ${customerSeed.length}`);
  console.log(`- deliveries: ${deliveryDocs.length}`);
  console.log(`- payments: ${paymentDocs.filter((payment) => payment.amount > 0).length}`);
  console.log(`- purchases: ${purchaseDocs.length}`);

  await mongoose.disconnect();
}

seedDemoData().catch(async (error) => {
  console.error("Failed to seed demo operational data.");
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
