const MIB = 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
const JPEG_PREFIX = "data:image/jpeg;base64,";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function check(condition, message, status = 400) {
  if (!condition) throw new ApiError(status, message);
}

function json(value, status = 200) {
  return Response.json(value, {
    status,
    headers: {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"}
  });
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringField(value, maximum, name, required = false) {
  if (value == null && !required) return "";
  check(typeof value === "string" && value.length <= maximum, name + "格式或長度不符");
  const clean = value.trim();
  check(!required || clean.length, "請填寫" + name);
  return clean;
}

function validId(id) {
  check(typeof id === "string" && SLUG.test(id), "無效的餐點或店家識別碼");
  return id;
}

function validScore(value) {
  check(value === null || (typeof value === "number" && value >= 0.5 && value <= 5
    && Number.isInteger(value * 2)), "請以半顆星為單位，選擇 0.5 到 5 顆星");
  return value;
}

function canEdit(request, env) {
  const owner = env.ALBUM_OWNER_EMAIL?.trim().toLowerCase();
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  return Boolean(owner && request.headers.get("oai-authenticated-user-id")?.trim() && email === owner);
}

async function readBody(request, limit) {
  check(request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() === "application/json",
    "請以 JSON 傳送紀錄", 415);
  const length = request.headers.get("Content-Length");
  check(length === null || (/^\d+$/.test(length) && Number(length) <= limit), "資料超過大小限制", 413);
  const reader = request.body?.getReader();
  check(reader, "缺少紀錄內容");
  const chunks = [];
  let bytesRead = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > limit) {
      await reader.cancel();
      throw new ApiError(413, "資料超過大小限制");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const data = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(body));
    check(isObject(data), "無效的紀錄內容");
    return data;
  } catch {
    throw new ApiError(400, "無效的 JSON 紀錄");
  }
}

function jpegBytes(photo) {
  check(typeof photo === "string" && photo.startsWith(JPEG_PREFIX), "每道餐點需附一張 JPEG 照片");
  const data = photo.slice(JPEG_PREFIX.length);
  check(data.length <= 4 * Math.ceil(MIB / 3), "單張照片需小於或等於 1 MB", 413);
  let decoded;
  try { decoded = atob(data); } catch { throw new ApiError(400, "照片資料不完整"); }
  check(decoded.length <= MIB, "單張照片需小於或等於 1 MB", 413);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  check(bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216
    && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217, "照片不是完整的 JPEG");
  return bytes;
}

async function digest(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, n => n.toString(16).padStart(2, "0")).join("");
}

async function parseVisit(data, categories) {
  check(typeof data.id === "string" && UUID.test(data.id), "無效的造訪識別碼");
  check(typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date), "請選擇造訪日期");
  const timestamp = Date.parse(data.date + "T00:00:00Z");
  check(Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === data.date,
    "無效的造訪日期");
  check(isObject(data.shop), "缺少店家資料");
  const shop = {
    id: validId(data.shop.id),
    name: stringField(data.shop.name, 160, "店名", true),
    englishName: stringField(data.shop.englishName, 160, "英文店名"),
    city: stringField(data.shop.city, 60, "縣市", true),
    district: stringField(data.shop.district, 60, "行政區", true),
    address: stringField(data.shop.address, 400, "地址")
  };
  check(Array.isArray(data.dishes) && data.dishes.length >= 1 && data.dishes.length <= 6, "每一餐可加入 1 至 6 道餐點");
  const dishIds = new Set();
  const dishes = [];
  const uploads = [];
  for (const entry of data.dishes) {
    check(isObject(entry), "餐點資料不完整");
    const id = validId(entry.id);
    check(!dishIds.has(id), "同次造訪的餐點不可重複");
    dishIds.add(id);
    const name = stringField(entry.name, 160, "菜名", true);
    check(Array.isArray(entry.categories) && entry.categories.length && entry.categories.length <= categories.length
      && entry.categories.every(c => categories.includes(c)), "請選擇有效的餐點類型");
    const price = entry.price ?? null;
    check(price === null || (Number.isFinite(price) && price >= 0 && price <= 1000000), "無效的餐點價格");
    check(entry.reviews == null || isObject(entry.reviews), "無效的心得格式");
    const bytes = jpegBytes(entry.photoData);
    const key = data.id + "-" + dishes.length + ".jpg";
    uploads.push({key, bytes, hash: await digest(bytes)});
    dishes.push({
      id, name, categories: [...new Set(entry.categories)], price, score: validScore(entry.score ?? null),
      orderer: stringField(entry.orderer, 80, "點餐者"),
      reviews: {me: stringField(entry.reviews?.me, 4000, "我的心得"),
        partner: stringField(entry.reviews?.partner, 4000, "男友心得")},
      alt: name + "的實拍照", photo: "/api/photos/" + key,
      date: data.date, visitId: data.id + "-" + dishes.length
    });
  }
  const canonical = JSON.stringify([shop, data.date, dishes, uploads.map(upload => upload.hash)]);
  return {shop, dishes, uploads, hash: await digest(new TextEncoder().encode(canonical))};
}

async function publish(env, data, categories) {
  const {shop, dishes, uploads, hash} = await parseVisit(data, categories);
  const db = env.DB;
  // Reserve the immutable request before any uploads. Readers cannot access pending rows or photos.
  await db.prepare(`INSERT INTO album_visits
    (id, request_hash, visit_date, shop_json, dishes_json) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`)
    .bind(data.id, hash, data.date, JSON.stringify(shop), JSON.stringify(dishes)).run();
  const row = await db.prepare("SELECT request_hash, published FROM album_visits WHERE id = ?").bind(data.id).first();
  check(row && row.request_hash === hash, "這個造訪編號已用於不同內容，請重新建立造訪", 409);
  const result = {shopId: shop.id, dishId: dishes[0].id};
  if (row.published) return json(result);
  // Retries with this id are byte-identical. Objects only become public when this batch commits.
  await Promise.all(uploads.map(upload => env.BUCKET.put(upload.key, upload.bytes, {
    httpMetadata: {contentType: "image/jpeg"}
  })));
  const statements = uploads.map(upload => db.prepare(
    "INSERT INTO album_photos (photo_key, visit_id) VALUES (?, ?) ON CONFLICT(photo_key) DO NOTHING"
  ).bind(upload.key, data.id));
  statements.push(db.prepare("UPDATE album_visits SET published = 1 WHERE id = ?").bind(data.id));
  await db.batch(statements);
  return json(result, 201);
}

async function getRestaurants(db, seeds) {
  const [visitRows, editRows] = await db.batch([
    db.prepare("SELECT visit_date, shop_json, dishes_json FROM album_visits WHERE published = 1 ORDER BY visit_date, rowid"),
    db.prepare("SELECT record_id, score, score_set, me, partner FROM album_edits")
  ]);
  const shops = new Map();
  const changes = new Map(editRows.results.map(row => [row.record_id, row]));
  function addDish(shop, entry) {
    let state = shops.get(shop.id);
    if (!state) {
      const {dishes, ...info} = shop;
      state = {info, dishes: new Map()};
      shops.set(shop.id, state);
    }
    const edit = changes.get(entry.visitId);
    const dish = {
      ...entry,
      score: edit?.score_set ? edit.score : entry.score,
      reviews: {me: edit?.me ?? entry.reviews?.me ?? "", partner: edit?.partner ?? entry.reviews?.partner ?? ""}
    };
    const visits = state.dishes.get(dish.id) ?? [];
    visits.push(dish);
    state.dishes.set(dish.id, visits);
  }
  for (const shop of seeds) for (const dish of shop.dishes) addDish(shop, dish);
  for (const row of visitRows.results) {
    const shop = JSON.parse(row.shop_json);
    for (const dish of JSON.parse(row.dishes_json)) addDish(shop, dish);
  }
  return Array.from(shops.values(), ({info, dishes}) => ({
    ...info, dishes: Array.from(dishes.values(), records => {
      // Stable sorting keeps insertion order for visits on the same day.
      records.sort((a, b) => (a.date || "").localeCompare(b.date || "")).reverse();
      const [latest, ...history] = records;
      return {...latest, history};
    })
  }));
}

async function patchRecord(db, seeds, recordId, patch) {
  const seedMatch = seeds.some(shop => shop.dishes.some(dish => dish.visitId === recordId));
  if (!seedMatch) {
    const match = /^([a-f0-9-]{36})-([0-5])$/i.exec(recordId);
    const row = match && await db.prepare("SELECT dishes_json FROM album_visits WHERE published = 1 AND id = ?")
      .bind(match[1]).first();
    check(row && JSON.parse(row.dishes_json).some(dish => dish.visitId === recordId), "找不到這筆餐點紀錄", 404);
  }
  check(Object.keys(patch).length > 0 && Object.keys(patch).every(key => ["reviews", "score"].includes(key)), "無效的更新欄位");
  const columns = [];
  const values = [];
  if (Object.hasOwn(patch, "score")) {
    columns.push("score", "score_set");
    values.push(validScore(patch.score), 1);
  }
  if (Object.hasOwn(patch, "reviews")) {
    check(isObject(patch.reviews) && Object.keys(patch.reviews).length > 0
      && Object.keys(patch.reviews).every(key => key === "me" || key === "partner"), "無效的心得欄位");
    for (const author of ["me", "partner"]) {
      if (!Object.hasOwn(patch.reviews, author)) continue;
      columns.push(author);
      values.push(stringField(patch.reviews[author], 4000, "心得"));
    }
  }
  // Columns are exclusively the enumerated fields above. Independent edits update only their own columns.
  const sql = "INSERT INTO album_edits (record_id, " + columns.join(", ") + ") VALUES (?, "
    + columns.map(() => "?").join(", ") + ") ON CONFLICT(record_id) DO UPDATE SET "
    + columns.map(column => column + " = excluded." + column).join(", ");
  await db.prepare(sql).bind(recordId, ...values).run();
  return json({saved: true});
}

async function servePhoto(env, key, method) {
  const row = await env.DB.prepare(`SELECT p.photo_key FROM album_photos p JOIN album_visits v ON v.id = p.visit_id
    WHERE p.photo_key = ? AND v.published = 1`).bind(key).first();
  check(row, "找不到照片", 404);
  const photo = method === "HEAD" ? await env.BUCKET.head(key) : await env.BUCKET.get(key);
  check(photo, "找不到照片", 404);
  return new Response(method === "HEAD" ? null : photo.body, {
    headers: {"Content-Type": "image/jpeg", "Content-Length": String(photo.size),
      "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable"}
  });
}

export async function handleApi(request, env, seedRestaurants, categories) {
  try {
    const url = new URL(request.url);
    const {pathname} = url;
    if (request.method === "GET" && pathname === "/api/album") {
      return json({restaurants: await getRestaurants(env.DB, seedRestaurants), categories,
        canEdit: canEdit(request, env), signInUrl: "/signin-with-chatgpt?return_to=%2Fnew-meal.html"});
    }
    const photo = /^\/api\/photos\/([0-9a-f-]{36}-[0-5]\.jpg)$/i.exec(pathname);
    if (photo && (request.method === "GET" || request.method === "HEAD")) {
      return await servePhoto(env, photo[1], request.method);
    }
    if (request.method === "POST" || request.method === "PATCH") {
      check(canEdit(request, env), "只有相簿主人可以發布或修改紀錄", 403);
      check(request.headers.get("Origin") === url.origin, "請從相簿網站提交修改", 403);
      if (request.method === "POST" && pathname === "/api/visits") {
        return await publish(env, await readBody(request, 9 * MIB), categories);
      }
      const record = /^\/api\/records\/([a-zA-Z0-9-]{1,150})$/.exec(pathname);
      if (request.method === "PATCH" && record) {
        return await patchRecord(env.DB, seedRestaurants, record[1], await readBody(request, 64 * 1024));
      }
    }
    throw new ApiError(404, "找不到這個頁面");
  } catch (error) {
    if (error instanceof ApiError) return json({error: error.message}, error.status);
    console.error("Album storage request failed:", error.name);
    return json({error: "相簿服務暫時無法連線，請稍後再試"}, 503);
  }
}
