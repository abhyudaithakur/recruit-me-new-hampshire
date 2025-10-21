# Backend
Add AWS Lambda handlers here. Example handler:

- src/handler.js
```js
export const handler = async (event) => {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true })
  };
};
```
