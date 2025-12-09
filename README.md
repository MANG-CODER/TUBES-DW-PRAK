## Install Tailwind
saat sudah clone install tailwind pake tailwind CLI

1. Salin ke terminal
```
npm install tailwindcss @tailwindcss/cli
```

2. Lalu jalankan tailwind
```
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

3. Tambahkan link ini di index agar terhubung ke css (`kalau sudah ada diganti`)
```
<link href="../src/output.css" rel="stylesheet">
```
