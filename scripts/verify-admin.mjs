import fs from "fs";
import path from "path";

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_PW = "cambiami";

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("🚀 [VERIFY] Avvio test approfonditi suite admin & API...");

  // 1. GET /api/products
  const resGet = await fetch(`${BASE_URL}/api/products`);
  if (!resGet.ok) throw new Error(`GET /api/products failed: ${resGet.status}`);
  const products = await resGet.json();
  console.log(`✅ [1] GET /api/products: ${products.length} prodotti recuperati.`);

  // 2. POST /api/products (creazione prodotto test)
  const testId = `test-prod-${Date.now()}`;
  const resPost = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: testId,
      title: "Test Sneaker 360Pallix",
      price: "49.99",
      image: "https://example.com/test.jpg",
      category: "SNEAKERS",
      brand: "Nike",
      seller: "Tester",
      cssbuyUrl: "https://www.cssbuy.com/item-test",
      doppelfitUrl: "https://doppel.fit/item-test",
      password: ADMIN_PW,
    }),
  });
  if (!resPost.ok) throw new Error(`POST /api/products failed: ${resPost.status}`);
  const postData = await resPost.json();
  console.log(`✅ [2] POST /api/products: creato prodotto test '${postData.product.id}'.`);

  // 3. GET /api/products/[id]
  const resGetSingle = await fetch(`${BASE_URL}/api/products/${testId}`);
  if (!resGetSingle.ok) throw new Error(`GET /api/products/${testId} failed: ${resGetSingle.status}`);
  const singleData = await resGetSingle.json();
  if (singleData.title !== "Test Sneaker 360Pallix") throw new Error("Single title mismatch");
  console.log(`✅ [3] GET /api/products/[id]: recuperato prodotto test.`);

  // 4. PUT /api/products/[id] - Password check
  const resPutBadPw = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "New Title",
      price: 20,
      image: "https://example.com/test.jpg",
      password: "wrong_password",
    }),
  });
  if (resPutBadPw.status !== 401) throw new Error(`Expected 401 for bad pw, got ${resPutBadPw.status}`);
  console.log(`✅ [4] PUT /api/products/[id]: rifiuto password errata (HTTP 401).`);

  // 5. PUT /api/products/[id] - Negative price check
  const resPutBadPrice = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
    body: JSON.stringify({
      title: "New Title",
      price: -10,
      image: "https://example.com/test.jpg",
    }),
  });
  if (resPutBadPrice.status !== 400) throw new Error(`Expected 400 for negative price, got ${resPutBadPrice.status}`);
  console.log(`✅ [5] PUT /api/products/[id]: rifiuto prezzo negativo o 0 (HTTP 400).`);

  // 6. PUT /api/products/[id] - Successful update & check password not leaked
  const resPut = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Updated Title 360Pallix",
      price: "55.50",
      image: "https://example.com/updated.jpg",
      category: "HOODIE",
      brand: "Supreme",
      seller: "Mook",
      cssbuyUrl: "https://www.cssbuy.com/updated",
      doppelfitUrl: "x5sUY8JQ", // short ID test
      password: ADMIN_PW,
    }),
  });
  if (!resPut.ok) throw new Error(`PUT /api/products/[id] failed: ${resPut.status}`);
  const putData = await resPut.json();
  if (putData.product.password) throw new Error("CRITICAL: Password leaked in PUT response product object!");
  if (!putData.product.doppelfitUrl.includes("https://doppel.fit/item/x5sUY8JQ?ref=PPnCbrec")) {
    throw new Error(`Doppelfit short ID formatting failed: ${putData.product.doppelfitUrl}`);
  }
  console.log(`✅ [6] PUT /api/products/[id]: aggiornato prodotto, verificata formattazione Doppelfit e NESSUN leak password.`);

  // 7. Check raw products.json on disk to verify no password was saved
  const rawProducts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "products.json"), "utf8"));
  const savedTest = rawProducts.find((p) => p.id === testId);
  if (!savedTest) throw new Error("Test product not found in products.json");
  if (savedTest.password) throw new Error("CRITICAL: Password saved in data/products.json!");
  console.log(`✅ [7] Verifica su disco (products.json): NESSUNA password salvata nel JSON.`);

  // 8. POST /api/upload - Test upload
  const boundary = "---------------------------974767299852498929531610575";
  const dummyFileContent = "GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;";
  const formData =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="password"\r\n\r\n${ADMIN_PW}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="test-pixel.gif"\r\n` +
    `Content-Type: image/gif\r\n\r\n${dummyFileContent}\r\n` +
    `--${boundary}--\r\n`;

  const resUpload = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: formData,
  });
  if (!resUpload.ok) {
    const errText = await resUpload.text();
    throw new Error(`POST /api/upload failed: ${resUpload.status} - ${errText}`);
  }
  const uploadData = await resUpload.json();
  if (!uploadData.url || !uploadData.url.startsWith("/uploads/")) {
    throw new Error(`Upload returned unexpected url: ${uploadData.url}`);
  }
  const uploadedDiskPath = path.join(process.cwd(), "public", uploadData.url.replace(/^\//, ""));
  if (!fs.existsSync(uploadedDiskPath)) throw new Error(`Uploaded file not found at ${uploadedDiskPath}`);
  console.log(`✅ [8] POST /api/upload: immagine caricata con successo in '${uploadData.url}'.`);
  // Clean up uploaded test file
  fs.unlinkSync(uploadedDiskPath);

  // 9. DELETE /api/products/[id]
  const resDel = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
  });
  if (!resDel.ok) throw new Error(`DELETE /api/products/${testId} failed: ${resDel.status}`);
  console.log(`✅ [9] DELETE /api/products/[id]: prodotto test eliminato.`);

  // 10. Repeat DELETE on same ID -> MUST return 404!
  const resDelAgain = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
  });
  if (resDelAgain.status !== 404) throw new Error(`Expected 404 on repeat delete, got ${resDelAgain.status}`);
  console.log(`✅ [10] Repeat DELETE: confermato 404 Not Found (nessun falso positivo).`);

  // 11. GET /admin HTML rendering check
  const resAdmin = await fetch(`${BASE_URL}/admin`);
  if (!resAdmin.ok) throw new Error(`GET /admin failed: ${resAdmin.status}`);
  const adminHtml = await resAdmin.text();
  if (!adminHtml.includes("Modifica Catalogo") || !adminHtml.includes("Pannello Amministrazione")) {
    throw new Error("Admin HTML missing expected strings");
  }
  console.log(`✅ [11] GET /admin: HTML 200 con tab e catalogo renderizzati correttamente.`);

  console.log("\n🎉 TUTTI I 11 TEST SUPERATI CON SUCCESSO! L'implementazione è solida e verificata.");
}

runTests().catch((err) => {
  console.error("❌ Test fallito:", err);
  process.exit(1);
});
