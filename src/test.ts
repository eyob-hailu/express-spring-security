// src/test.ts
import express, { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

// Import everything from your brand new library!
import {
  SecurityFilterChain,
  JwtAuthenticationFilter,
  SecurityContextHolder,
  PreAuthorize
} from './index';

const app = express();
const SECRET_KEY = "my-super-secret-test-key";

// ==========================================
// 1. Define the Controller (Testing Decorators)
// ==========================================
class TestController {

  // No decorator - should be open to the public
  public getPublicData(req: Request, res: Response) {
    res.json({ message: "Success: Anyone can see this!" });
  }

  // Requires 'USER' role
  @PreAuthorize("USER")
  public getUserData(req: Request, res: Response) {
    // Testing the AsyncLocalStorage context bubble!
    const user = SecurityContextHolder.getContext().user;
    res.json({ message: `Success: Welcome back, ${user?.username}!` });
  }

  // Requires 'ADMIN' role
  @PreAuthorize("ADMIN")
  public getAdminData(req: Request, res: Response) {
    res.json({ message: "Success: Admin access granted!" });
  }
}

// ==========================================
// 2. Apply the Security Engine
// ==========================================
new SecurityFilterChain(app)
  .addPreFilter(express.json())
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter(SECRET_KEY))
  .apply();

// ==========================================
// 3. Register the Routes
// ==========================================
const controller = new TestController();
// Note: We use .bind() so Express doesn't lose the class 'this' context
app.get('/api/public', controller.getPublicData.bind(controller));
app.get('/api/user', controller.getUserData);
app.get('/api/admin', controller.getAdminData);


// ==========================================
// 4. Start Server & Print Test Tokens
// ==========================================
app.listen(3000, () => {
  // Generate valid tokens so you can actually test the endpoints
  const userToken = jwt.sign({ id: 1, username: "eyob", roles: ["USER"] }, SECRET_KEY, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: 2, username: "boss", roles: ["ADMIN"] }, SECRET_KEY, { expiresIn: '1h' });

  console.log("🚀 Security Server running on http://localhost:3000");
  console.log("\n--- COPY THESE TOKENS FOR POSTMAN / CURL ---");
  console.log("USER TOKEN:\n" + userToken + "\n");
  console.log("ADMIN TOKEN:\n" + adminToken + "\n");
});