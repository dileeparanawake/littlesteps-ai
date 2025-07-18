## ✅ Backend Stub: Key Build Steps

### 📁 1. **Create the file**

- Make sure you have:  
  `src/app/api/prompt/route.ts`  
  (Looks like you've already done this ✅)

---

### 🔧 2. **Define a `POST` handler**

- Export an async `POST` function that takes a `Request` object
- Parse the incoming JSON body

---

### 📥 3. **Validate input**

- Ensure the body has a `message: string`
- Return a 400 error if it's missing or invalid

---

### 🤖 4. **Stub a fake response**

- Create a string response like `"fake reply to: {message}"`
- Format it in a JSON object: `{ response: "..." }`

---

### 📤 5. **Return a response**

- Use `NextResponse.json(...)` to send the result
- Catch errors and return a 500 with `{ error: "..." }`

---

### ✅ 6. **Test it locally**

- Use Postman, curl, or your frontend to POST to `/api/prompt`
- Check that it returns your fake response

### Example

```ts
// app/api/prompt/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    // Stubbed response logic
    const fakeResponse = `This is a fake reply to: "${body.message}"`;

    return NextResponse.json({ response: fakeResponse });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```
