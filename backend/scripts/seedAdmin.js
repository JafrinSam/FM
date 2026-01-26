import dotenv from 'dotenv';
import argon2 from 'argon2';
import User from '../models/User.js'; 
import { connectDB, disconnectDB } from '../config/mongoConnect.js'; // Adjust path if needed

// 1. Load Environment Variables
dotenv.config();

const seedSuperAdmin = async () => {
  try {
    // 2. Connect using your modular controller
    await connectDB(); 

    // 3. Security Check: Ensure Pepper exists
    const pepper = process.env.PEPPER_SECRET;
    if (!pepper) {
      throw new Error("❌ PEPPER_SECRET is missing in .env file. Cannot secure password.");
    }

    // 4. Check if Super Admin already exists
    const exists = await User.findOne({ role: 'super_admin' });
    if (exists) {
      console.log("⚠️  Super Admin already exists! No changes made.");
      await disconnectDB();
      process.exit(0);
    }

    // 5. Prepare Password with Salt + Pepper Strategy
    // Note: Argon2 automatically handles the secure random Salt.
    // We manually handle the Pepper here.
    const rawPassword = "Admin@123"; // Change this to your desired initial password
    const passwordWithPepper = rawPassword + pepper;
    
    // CHANGE THIS LINE
    const hashedPassword = await argon2.hash(passwordWithPepper, {
      type: argon2.argon2id, // Explicitly enforce Argon2id
      memoryCost: 2 ** 16,   // 64 MB (Good balance for servers)
      timeCost: 3,           // 3 iterations (Increase if server is powerful)
      parallelism: 1         // 1 thread
    });

    // 6. Create the User
    await User.create({
      name: "Root Admin",
      email: "root@admin.com", // Change this email!
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
      mustChangePassword: false, 
      authProvider: 'local',
      // Optional: Add verified status if your schema has it
      // isVerified: true 
    });

    console.log("✅ Super Admin created successfully!");

  } catch (error) {
    console.error("❌ Seeding Failed:", error.message);
    process.exit(1);
  } finally {
    // 7. Clean Disconnect
    await disconnectDB();
    process.exit(0);
  }
};

seedSuperAdmin();