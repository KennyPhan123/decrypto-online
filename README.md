# Decrypto Online

Đây là phiên bản web online của board game giải mã **Decrypto**. 
Trò chơi được xây dựng bằng HTML/CSS/JS thuần cho giao diện và sử dụng **PartyKit** để quản lý trạng thái real-time multiplayer.

## 🔗 Link chơi Game
Bạn có thể chơi game trực tuyến tại: **[https://decrypto-online.kennyphan123.partykit.dev](https://decrypto-online.kennyphan123.partykit.dev)**

*(Lưu ý: Nếu link trên chưa hoạt động, bạn cần chạy lệnh deploy theo hướng dẫn bên dưới)*

## 🎲 Luật chơi
Decrypto là trò chơi giao tiếp bí mật giữa 2 đội. Mỗi đội sẽ có 4 từ khóa bí mật. Mỗi vòng, một người trong đội sẽ nhận được mã số gồm 3 chữ số (ví dụ: `2-4-1`) và phải đưa ra 3 gợi ý sao cho đồng đội đoán đúng mã số, nhưng không để đội đối phương "chặn" được (đoán ra quy luật từ khóa).
Chi tiết luật chơi vui lòng xem tại file `decrypto rules.md`.

## 🛠️ Cài đặt và Chạy cục bộ (Local Development)

Dự án yêu cầu **Node.js** được cài đặt sẵn.

1. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

2. **Build giao diện Frontend:**
   ```bash
   npm run build
   ```
   *(Code frontend trong `src/` sẽ được build bằng Vite vào thư mục `dist/`)*

3. **Chạy Server Game:**
   ```bash
   npm run serve
   ```
   *(Trò chơi sẽ có mặt tại `http://127.0.0.1:1999/`)*

## 🚀 Triển khai (Deploy)
Để triển khai phiên bản mới nhất lên server của PartyKit, chạy lệnh:
```bash
npx partykit deploy
```
*(Nếu là lần đầu tiên, hệ thống sẽ yêu cầu bạn đăng nhập bằng tài khoản GitHub)*