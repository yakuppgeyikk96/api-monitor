# Unit Test Planı — API Monitor

## Mevcut Durum

| Alan | Test Altyapısı | Mevcut Test |
|------|---------------|-------------|
| **API** (`apps/api`) | Yok — Vitest eklenmeli | 0 test dosyası |
| **Web** (`apps/web`) | Vitest 4 + `@angular/build:unit-test` yapılandırılmış | 1 dosya (`app.spec.ts`, güncel değil) |
| **shared-types** (`packages/shared-types`) | Yok | 0 test dosyası |

---

## Bölüm 1 — API Backend (`apps/api`)

### 1.1 Test Altyapısı Kurulumu

Vitest eklenecek. Test dosyaları her modülün yanına `__tests__/` dizinine konulacak.

```
apps/api/
├── vitest.config.ts
├── src/
│   ├── common/__tests__/
│   ├── modules/auth/__tests__/
│   ├── modules/users/__tests__/
│   ├── modules/workspaces/__tests__/
│   ├── modules/services/__tests__/
│   └── modules/endpoints/__tests__/
```

Gerekli paketler: `vitest`, `@vitest/coverage-v8`

### 1.2 Common Utilities

#### `common/slug.ts` — `generateSlug()`
| # | Test Senaryosu | Girdi | Beklenen Çıktı |
|---|---------------|-------|----------------|
| 1 | Boşlukları tire yapar | `"My Workspace"` | `"my-workspace"` |
| 2 | Özel karakterleri kaldırır | `"Test @#$ Slug!"` | `"test--slug"` |
| 3 | Büyük harfleri küçültür | `"HELLO WORLD"` | `"hello-world"` |
| 4 | Birden fazla boşluk → tek tire | `"a   b"` | `"a-b"` |
| 5 | Zaten geçerli slug | `"valid-slug"` | `"valid-slug"` |
| 6 | Boş string | `""` | `""` |
| 7 | Türkçe/unicode karakterler kaldırılır | `"Merhaba Dünya"` | `"merhaba-dnya"` |

#### `common/password.ts` — `hashPassword()` & `verifyPassword()`
| # | Test Senaryosu |
|---|---------------|
| 1 | Hash sonucu orijinal şifreden farklıdır |
| 2 | Doğru şifre ile `verifyPassword` → `true` |
| 3 | Yanlış şifre ile `verifyPassword` → `false` |
| 4 | Aynı şifre iki kez hash'lense bile farklı hash üretir (salt) |

#### `common/errors.ts` — `AuthError` & `AppError`
| # | Test Senaryosu |
|---|---------------|
| 1 | `AuthError` doğru `code`, `message` ve `name` taşır |
| 2 | `AuthError` instanceof `Error` |
| 3 | `AppError` varsayılan `statusCode` 400 |
| 4 | `AppError` özel `statusCode` alabilir |
| 5 | `AppError` instanceof `Error` |

#### `common/jwt.ts` — `JWT_CONFIG`
| # | Test Senaryosu |
|---|---------------|
| 1 | `cookieName` değeri `"token"` |
| 2 | `expiresIn` env yokken varsayılan `"7d"` |

---

### 1.3 Auth Modülü

#### `auth.service.ts` — `createAuthService()`

Mock'lanacak bağımlılıklar: `userRepository`, `fastify.jwt.sign`

**register()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Başarılı kayıt — yeni kullanıcı | `{ token, user }` döner, `userRepository.create` çağrılır |
| 2 | Email zaten kayıtlı | `AuthError(EMAIL_TAKEN)` fırlatılır |
| 3 | Dönen `user` objesi `passwordHash` içermez | `toAuthUser` dönüşümü doğru çalışır |
| 4 | `hashPassword` çağrılır, plain password DB'ye gitmez | `userRepository.create` hash ile çağrılır |

**login()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 5 | Başarılı giriş | `{ token, user }` döner |
| 6 | Email bulunamaz | `AuthError(INVALID_CREDENTIALS)` |
| 7 | Yanlış şifre | `AuthError(INVALID_CREDENTIALS)` |
| 8 | JWT payload `{ sub, email }` formatında | `fastify.jwt.sign` doğru payload ile çağrılır |

**me()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 9 | Kullanıcı bulunur | `AuthUser` objesi döner |
| 10 | Kullanıcı bulunamaz | `AuthError(USER_NOT_FOUND)` |

---

### 1.4 Workspace Modülü

#### `workspace.service.ts` — `createWorkspaceService()`

Mock'lanacak: `WorkspaceRepository`

**create()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Slug verilmişse → verilen slug kullanılır | `repository.create` verilen slug ile çağrılır |
| 2 | Slug verilmemişse → `generateSlug(name)` kullanılır | Otomatik slug üretilir |
| 3 | Slug zaten mevcutsa | `AppError(SLUG_TAKEN, 409)` |
| 4 | Başarılı oluşturma | `repository.create` doğru parametrelerle çağrılır |

**list()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 5 | Kullanıcının workspace'leri listelenir | `repository.findAllByOwnerId(ownerId)` çağrılır |

**getById()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 6 | Workspace bulunur + sahiplik doğru | Workspace döner |
| 7 | Workspace bulunamaz | `AppError(WORKSPACE_NOT_FOUND, 404)` |
| 8 | Sahip değilse | `AppError(FORBIDDEN, 403)` |

**update()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 9 | Başarılı güncelleme | `repository.update` çağrılır |
| 10 | Sahip değilse güncelleme reddedilir | `AppError(FORBIDDEN, 403)` |
| 11 | Yeni slug mevcutsa | `AppError(SLUG_TAKEN, 409)` |
| 12 | Aynı workspace'in kendi slug'ı → hata olmaz | `excludeId` mekanizması çalışır |

**remove()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 13 | Başarılı silme | `repository.softDeleteCascade` çağrılır |
| 14 | Sahip değilse silme reddedilir | `AppError(FORBIDDEN, 403)` |

---

### 1.5 Service Modülü

#### `service.service.ts` — `createServiceService()`

Mock'lanacak: `ServiceRepository`, `WorkspaceRepository`

**create()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Başarılı oluşturma | `repository.create` doğru data ile çağrılır |
| 2 | Workspace bulunamaz | `AppError(WORKSPACE_NOT_FOUND, 404)` |
| 3 | Workspace sahibi değilse | `AppError(FORBIDDEN, 403)` |
| 4 | Opsiyonel alanlar varsayılanlarla doldurulur | `defaultHeaders: null`, `defaultTimeoutSeconds: 30` |

**list()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 5 | Başarılı listeleme | `repository.findAllByWorkspaceId` çağrılır |
| 6 | Workspace sahibi değilse | `AppError(FORBIDDEN, 403)` |

**getById()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 7 | Başarılı getirme | Service döner |
| 8 | Service bulunamaz | `AppError(SERVICE_NOT_FOUND, 404)` |

**update()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 9 | Başarılı güncelleme | `repository.update` çağrılır |
| 10 | Service yoksa güncelleme reddedilir | `AppError(SERVICE_NOT_FOUND, 404)` |

**remove()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 11 | Başarılı cascade silme | `repository.softDeleteCascade` çağrılır |
| 12 | Service yoksa silme reddedilir | `AppError(SERVICE_NOT_FOUND, 404)` |

---

### 1.6 Endpoint Modülü

#### `endpoint.service.ts` — `createEndpointService()`

Mock'lanacak: `EndpointRepository`, `ServiceRepository`, `WorkspaceRepository`

**create()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Başarılı oluşturma | `repository.create` tüm alanlarla çağrılır |
| 2 | Workspace bulunamaz | `AppError(WORKSPACE_NOT_FOUND, 404)` |
| 3 | Workspace sahibi değilse | `AppError(FORBIDDEN, 403)` |
| 4 | Service bulunamaz | `AppError(SERVICE_NOT_FOUND, 404)` |
| 5 | Opsiyonel alanlar varsayılanlarla doldurulur | `expectedStatusCode: 200`, `checkIntervalSeconds: 300`, `isActive: true`, `headers/body/expectedBody: null` |

**list()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 6 | Başarılı listeleme | `repository.findAllByServiceId` çağrılır |
| 7 | Validasyon zinciri çalışır | Workspace → Service sırasıyla kontrol edilir |

**getById()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 8 | Başarılı getirme | Endpoint döner |
| 9 | Endpoint bulunamaz | `AppError(ENDPOINT_NOT_FOUND, 404)` |

**update()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 10 | Başarılı güncelleme | `repository.update` çağrılır |
| 11 | Endpoint yoksa güncelleme reddedilir | `AppError(ENDPOINT_NOT_FOUND, 404)` |

**remove()**
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 12 | Başarılı cascade silme | `repository.softDeleteCascade` çağrılır |
| 13 | Endpoint yoksa silme reddedilir | `AppError(ENDPOINT_NOT_FOUND, 404)` |

---

### 1.7 DB Helpers

#### `db/helpers.ts` — `withActive()`

> **Not:** Bu fonksiyon Drizzle ORM SQL nesneleri üretir. Birim testinde gerçek DB'ye gerek olmadan, dönen SQL nesnesinin `isNull(deletedAt)` koşulu içerdiği doğrulanabilir. Alternatif olarak, bu testler entegrasyon testlerine bırakılabilir.

| # | Test Senaryosu |
|---|---------------|
| 1 | Ek koşul yokken sadece `isNull(deletedAt)` üretir |
| 2 | Bir ek koşul ile `AND(condition, isNull(deletedAt))` üretir |
| 3 | Birden fazla ek koşul ile hepsi `AND` ile birleşir |

---

## Bölüm 2 — Web Frontend (`apps/web`)

### 2.1 Test Altyapısı

Vitest zaten yapılandırılmış (`@angular/build:unit-test`). Test dosyaları ilgili dosyanın yanına `*.spec.ts` olarak konulacak.

Gerekli: `app.spec.ts` güncellenmeli (güncel olmayan render testi).

### 2.2 Core Services

#### `auth-store.ts` — `AuthStore`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Başlangıç durumu → `user()` null | `isAuthenticated()` false |
| 2 | `setUser(user)` → signal güncellenir | `user()` ve `isAuthenticated()` doğru |
| 3 | `clear()` → null'a döner | `isAuthenticated()` false |
| 4 | `init()` başarılı API yanıtı → user set edilir | `_user` signal güncellenir |
| 5 | `init()` hata yanıtı → reject etmez, resolve olur | Promise resolve olur, user null kalır |

#### `auth-api.ts` — `AuthApi`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | `register()` → POST `/auth/register` | Doğru URL ve method |
| 2 | `login()` → POST `/auth/login` | Doğru URL ve method |
| 3 | `me()` → GET `/auth/me` | Doğru URL ve method |
| 4 | `logout()` → POST `/auth/logout` | Doğru URL ve boş body |

#### `workspace-api.ts` — `WorkspaceApi`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | `list()` → GET | Doğru URL |
| 2 | `create(input)` → POST | Body doğru |
| 3 | `update(id, input)` → PATCH | URL'de id var |
| 4 | `remove(id)` → DELETE | URL'de id var |

#### `service-api.ts` — `ServiceApi`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1-4 | CRUD operasyonları | URL pattern `/workspaces/:wid/services/...` doğru |

#### `endpoint-api.ts` — `EndpointApi`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1-4 | CRUD operasyonları | URL pattern `/workspaces/:wid/services/:sid/endpoints/...` doğru |

#### `sidebar.ts` — `SidebarService` (varsa)
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Toggle açma/kapama | Signal state değişir |

---

### 2.3 Guards

#### `auth-guard.ts` — `authGuard`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Authenticated ise → `true` döner | Route'a erişim izni |
| 2 | Not authenticated ise → login'e yönlendirir | `UrlTree` login path'e |
| 3 | ReturnUrl parametresi eklenir | `queryParams.returnUrl` mevcut |
| 4 | Root URL ise returnUrl eklenmez | `queryParams` boş |

#### `guest-guard.ts` — `guestGuard`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Not authenticated → `true` | Route'a erişim izni |
| 2 | Authenticated → dashboard'a yönlendirir | `UrlTree` dashboard path'e |

---

### 2.4 Interceptors

#### `credentials.ts` — `credentialsInterceptor`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Request'e `withCredentials: true` eklenir | Clone edilmiş request kontrolü |

#### `auth-interceptor.ts` — `authInterceptor`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | 401 hatası → `authStore.clear()` çağrılır, login'e yönlenir | State temizlenir |
| 2 | 401 + `/auth/me` URL'si → yönlendirme yapılmaz | Özel durum: me endpoint'i |
| 3 | 401 dışındaki hatalar → normal pass-through | Hata olduğu gibi fırlatılır |
| 4 | Başarılı yanıt → hiçbir şey yapmaz | Response değişmez |

---

### 2.5 Shared Components

#### `Input` (ControlValueAccessor)
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | `writeValue` → value signal güncellenir | Input değeri set edilir |
| 2 | `onInput` event → `onChange` callback çağrılır | Form kontrole değer aktarılır |
| 3 | `onBlur` → `onTouched` callback çağrılır | Touched state güncellenir |
| 4 | `setDisabledState(true)` → `isDisabled` signal güncellenir | Input disabled olur |
| 5 | `writeValue(null)` → boş string olur | Null-safe |

#### `Button`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Varsayılan variant `primary` | CSS class doğru |
| 2 | `loading=true` → disabled gösterilir | Button disabled |
| 3 | Label doğru render edilir | Text content kontrolü |

#### `Dialog`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | `open=true` → dialog görünür | DOM'da mevcut |
| 2 | `open=false` → dialog gizli | DOM'da yok veya hidden |
| 3 | Kapatma → `closed` event emit eder | EventEmitter kontrolü |

#### `DataTable`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | `loading=true` → skeleton satırlar gösterilir | 3 skeleton row |
| 2 | Boş data → empty state gösterilir | `emptyText` gösterilir |
| 3 | Data varsa → satırlar render edilir | `data.length` kadar satır |
| 4 | `cellTemplateMap` computed doğru çalışır | Key-template eşleşmesi |

---

### 2.6 Feature Components

#### `Login`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Form geçersizken submit → API çağrılmaz | `markAllAsTouched` çağrılır |
| 2 | Başarılı login → `authStore.setUser` çağrılır, yönlendirme yapılır | Dashboard'a navigate |
| 3 | returnUrl varsa → o URL'ye yönlenir | Parametre kontrolü |
| 4 | API hatası → `serverError` signal güncellenir | Hata mesajı gösterilir |
| 5 | `getError('email')` → doğru validation mesajı | required, email formatı |
| 6 | `getError('password')` → doğru validation mesajı | required, minLength |
| 7 | Loading durumu → `loading` signal doğru yönetilir | true → API → false |

#### `Register`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1-6 | Login ile paralel senaryolar | `fullName` ek validasyonu dahil |

#### `Workspaces`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | `ngOnInit` → workspace listesi yüklenir | `loadWorkspaces` çağrılır |
| 2 | Create dialog açılır/kapanır | Signal state doğru |
| 3 | `onSubmit()` başarılı → dialog kapanır, liste yenilenir | API çağrısı + reload |
| 4 | `onSubmit()` hata → `serverError` güncellenir | Hata mesajı set edilir |
| 5 | `onEdit(workspace)` → form patch edilir, edit dialog açılır | Signal + form state |
| 6 | `onEditSubmit()` başarılı → dialog kapanır, liste yenilenir | API update çağrısı |
| 7 | `onDelete(workspace)` → delete dialog açılır | `selectedWorkspace` set edilir |
| 8 | `onConfirmDelete()` başarılı → dialog kapanır, liste yenilenir | API delete çağrısı |
| 9 | `onCreateDialogClosed()` → form reset, error temizlenir | Clean state |
| 10 | `getError()` doğru mesajlar döner | required, maxlength |

#### `Services`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1-8 | Workspaces ile benzer CRUD senaryoları | Workspace dropdown seçimi ek |

#### `Endpoints`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1-8 | Services ile benzer CRUD senaryoları | Workspace → Service hiyerarşik seçim |
| 9 | JSON alanları (headers, body, expectedBody) parse edilir | JSON.parse çağrısı |

---

## Bölüm 3 — Shared Types (`packages/shared-types`)

> Shared types paketi sadece TypeScript interface ve const tanımları içerir. Runtime davranışı minimumdur. Test yazılacak dosya:

#### `errors.ts`
| # | Test Senaryosu | Beklenen |
|---|---------------|----------|
| 1 | Her `ErrorCode` key'inin `ErrorMessage`'da karşılığı var | Eksik mesaj yok |
| 2 | `ErrorCode` değerleri UPPER_SNAKE_CASE | Format kontrolü |

---

## Bölüm 4 — Önceliklendirme ve Uygulama Sırası

### Faz 1 — Temel Altyapı (Öncelik: Yüksek)
1. API projesine Vitest + test script eklenmesi
2. `turbo.json`'a `test` task eklenmesi
3. Root `package.json`'a `test` script eklenmesi

### Faz 2 — API Common Utilities (Öncelik: Yüksek)
4. `slug.ts` testleri (saf fonksiyon, bağımlılık yok)
5. `password.ts` testleri (argon2 ile)
6. `errors.ts` testleri

### Faz 3 — API Service Katmanı (Öncelik: Yüksek)
7. `auth.service.ts` testleri (mock repository + mock jwt)
8. `workspace.service.ts` testleri (mock repository)
9. `service.service.ts` testleri (mock repository'ler)
10. `endpoint.service.ts` testleri (mock repository'ler)

### Faz 4 — Frontend Core (Öncelik: Orta)
11. `AuthStore` testleri
12. `authGuard` ve `guestGuard` testleri
13. `credentialsInterceptor` ve `authInterceptor` testleri
14. API service testleri (HttpClientTestingModule ile)

### Faz 5 — Frontend Shared Components (Öncelik: Orta)
15. `Input` (CVA) testleri
16. `Button` testleri
17. `Dialog` testleri
18. `DataTable` testleri

### Faz 6 — Frontend Features (Öncelik: Düşük-Orta)
19. `Login` component testleri
20. `Register` component testleri
21. `Workspaces` component testleri
22. `Services` component testleri
23. `Endpoints` component testleri

### Faz 7 — Shared Types (Öncelik: Düşük)
24. `errors.ts` consistency testleri

---

## Test Yazım Kuralları

### API Testleri
- **Test framework:** Vitest
- **Mock stratejisi:** Her service testi repository'leri `vi.fn()` ile mock'lar
- **Dosya adlandırma:** `*.test.ts` (`*.spec.ts` frontend'e ayrılmış)
- **Her test izole:** Bağımlılıklar `beforeEach`'te sıfırlanır
- **DB'ye erişim yok:** Service testleri tamamen mock repository'ler üzerinden çalışır

### Frontend Testleri
- **Test framework:** Vitest (`@angular/build:unit-test` builder)
- **Dosya adlandırma:** `*.spec.ts` (Angular konvansiyonu)
- **Component testleri:** `TestBed.configureTestingModule` ile
- **HTTP testleri:** `provideHttpClientTesting` + `HttpTestingController` ile
- **Guard/Interceptor testleri:** `TestBed` + mock `AuthStore` ile
- **Signal testleri:** Doğrudan signal değeri okunarak assert edilir

---

## Toplam Test Sayısı Tahmini

| Katman | Dosya Sayısı | Tahmini Test Sayısı |
|--------|-------------|-------------------|
| API Common | 3 | ~18 |
| API Auth Service | 1 | ~10 |
| API Workspace Service | 1 | ~14 |
| API Service Service | 1 | ~12 |
| API Endpoint Service | 1 | ~13 |
| Frontend Core Services | 6 | ~25 |
| Frontend Guards | 2 | ~6 |
| Frontend Interceptors | 2 | ~7 |
| Frontend Shared Components | 4 | ~16 |
| Frontend Features | 5 | ~40 |
| Shared Types | 1 | ~2 |
| **Toplam** | **27** | **~163** |
