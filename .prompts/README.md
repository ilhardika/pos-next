# Prompt Files untuk POS Next.js Project

Direktori ini berisi template prompt dan konfigurasi untuk berbagai aspek pengembangan aplikasi POS.

## Structure

```
.prompts/
├── README.md                 # Panduan penggunaan
├── modes/                    # Mode kerja untuk berbagai konteks
│   ├── development.md       # Mode pengembangan fitur
│   ├── debugging.md         # Mode debugging dan troubleshooting
│   ├── refactoring.md       # Mode refactoring code
│   └── testing.md           # Mode testing dan QA
├── templates/               # Template prompt untuk task umum
│   ├── feature-development.md
│   ├── bug-fix.md
│   ├── database-migration.md
│   └── ui-component.md
├── tools/                   # Tool sets untuk berbagai keperluan
│   ├── supabase-tools.md
│   ├── ui-tools.md
│   ├── auth-tools.md
│   └── transaction-tools.md
└── workflows/               # Workflow pengembangan
    ├── new-feature.md
    ├── hotfix.md
    └── code-review.md
```

## Cara Penggunaan

1. Pilih mode yang sesuai dengan konteks kerja Anda
2. Gunakan template prompt sesuai dengan jenis task
3. Ikuti workflow yang telah didefinisikan
4. Gunakan tool sets yang relevan untuk domain spesifik

## Quick Start

Untuk memulai pengembangan fitur baru:

```bash
# 1. Baca mode development
cat .prompts/modes/development.md

# 2. Gunakan template feature development
cat .prompts/templates/feature-development.md

# 3. Ikuti workflow new feature
cat .prompts/workflows/new-feature.md
```
