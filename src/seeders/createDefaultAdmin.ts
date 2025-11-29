import { User } from "../models/user.model.js";
import { UserRole, UserMode } from "../types/common.types.js";
import { config } from "../config/environment.js";

export const createDefaultAdmin = async () => {
  const email = config.seedAdmin.email;
  const password = config.seedAdmin.password;

  // Check if admin already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Default admin already exists.");
    return;
  }

  await User.create({
    email,
    password, // hashed automatically in pre('save')
    fullName: "Futsmandu Admin",
    phoneNumber: "9825883910",
    role: UserRole.ADMIN,
    mode: UserMode.ADMIN,
    isActive: true,
  });

  console.log("✔ Default admin created successfully!");
};
