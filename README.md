# VNZ Website

Ứng dụng Next.js độc lập. Thư mục này là root của repository Website; không cần source hoặc dependency của Admin.

## Cài đặt và kiểm tra

Dùng pnpm `10.34.5`, theo trường `packageManager` trong `package.json`.

Môi trường đã dùng để kiểm tra: Node.js `24.19.0` và pnpm `10.34.5`.

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

`pnpm-workspace.yaml` chỉ bao gồm Website và phê duyệt các build script của `sharp`, `unrs-resolver`. Commit cả `package.json`, `pnpm-workspace.yaml` và `pnpm-lock.yaml`. Khi thay đổi dependency, chạy `pnpm install` và commit lockfile cập nhật.

## Chạy local

Copy `.env.example` thành `.env.local`, cấu hình `VNZ_API_URL`, sau đó chạy `pnpm dev`. Website chạy tại `http://localhost:3002`.

Hai test trong `tests/` kiểm tra sprite thành viên và menu Website, chạy bằng Node và `jsdom`. Bộ test không phụ thuộc vào Admin.

Không commit `.env.local`, `node_modules`, `.next` hoặc các file build/cache. Khi push repository mới, lấy toàn bộ nội dung thư mục này làm root.
