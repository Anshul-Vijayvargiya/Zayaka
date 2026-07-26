import mongoose from "mongoose";
const { Schema, model } = mongoose;

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    tagline: String,
    address: String,
    gstRate: { type: Number, default: 18 },
    currency: { type: String, default: "INR" },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: String,
    googleId: String,
    role: {
      type: String,
      enum: ["owner", "staff", "kitchen", "customer"],
      default: "customer",
    },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const otpSchema = new Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  purpose: { type: String, default: "verify" },
  expiresAt: { type: Date, required: true },
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const menuItemSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    price: { type: Number, required: true },
    isVeg: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    imageUrl: String,
    prepMinutes: { type: Number, default: 12 },
    tags: [String],
  },
  { timestamps: true }
);

const tableSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    number: { type: Number, required: true },
    capacity: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ["free", "occupied", "billing"],
      default: "free",
    },
  },
  { timestamps: true }
);

const orderItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    name: String,
    price: Number,
    qty: { type: Number, default: 1 },
    notes: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table" },
    tableNumber: Number,
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: String,
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["placed", "accepted", "preparing", "ready", "served", "paid", "cancelled"],
      default: "placed",
      index: true,
    },
    subtotal: Number,
    gst: Number,
    total: Number,
    placedAt: { type: Date, default: Date.now, index: true },
    paidAt: Date,
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

const waitlistSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    partySize: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["waiting", "notified", "seated", "left"],
      default: "waiting",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const inventoryItemSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    name: { type: String, required: true },
    unit: { type: String, default: "kg" },
    quantity: { type: Number, default: 0 },
    lowThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const Restaurant = model("Restaurant", restaurantSchema);
export const User = model("User", userSchema);
export const Otp = model("Otp", otpSchema);
export const MenuItem = model("MenuItem", menuItemSchema);
export const Table = model("Table", tableSchema);
export const Order = model("Order", orderSchema);
export const Waitlist = model("Waitlist", waitlistSchema);
export const InventoryItem = model("InventoryItem", inventoryItemSchema);
