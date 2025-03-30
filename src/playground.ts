import { db } from "./server/db";

await db.user.create({
    data: {
        firstName: "John",
        lastName: "Doe",
        emailAddress: "test@test.com",
    }
})
console.log("User created");