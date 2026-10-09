# Windows 98 Retro Introduction Page (.moe Bio Card) 💻✨

A lightweight, nostalgic Windows 98 desktop introduction page designed for Twitter/X bio links, Neocities fans, and .moe domains. Self-hostable on **GitHub Pages** with zero build tools or dependencies required.

---

## 📁 Project Structure

```
meishi/
├── index.html        # Main desktop UI & windows structure
├── style.css         # Authentic Windows 98 styling, bevels & responsive layouts
├── script.js         # Window drag/drop, audio synthesizer, taskbar, clock, & dialogs
├── CNAME             # Your custom domain configuration (e.g. yourname.moe)
└── README.md         # Deployment & customization guide
```

---

## 🚀 Quick Preview Locally

You can preview the site immediately by double-clicking `index.html` or opening it in any browser:
```powershell
Start-Process "index.html"
```

---

## 🌐 How to Host on GitHub Pages with Your Custom Domain

### Step 1: Create a Repository on GitHub
1. Go to [GitHub](https://github.com) and click **New Repository**.
2. Name it either:
   - `<your-username>.github.io` (User site root), or
   - Any name like `intro` or `links`.
3. Set the repository to **Public**.
4. Leave "Add a README file" unchecked (since we already have one).

### Step 2: Push Your Code to the Repository
If you have Git installed, run these commands inside the `meishi` folder:

```powershell
git init
git add .
git commit -m "Initial commit: Windows 98 intro page"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

*(If you don't have Git installed yet, see the "Installing Git" section below, or you can drag-and-drop the files directly via GitHub's "Upload files" button on the web).*

### Step 3: Configure GitHub Pages
1. On your repository page, click **Settings** (gear icon) → **Pages** (on the left menu).
2. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` and `/ (root)`, then click **Save**.

### Step 4: Add Your Custom Domain (`atlus.moe`)
1. The `CNAME` file in this folder is already set to `atlus.moe`.
2. Commit and push the updated `CNAME` file.
3. In GitHub Repository **Settings** → **Pages**:
   - Under **Custom domain**, verify your domain appears.
   - Check the box for **Enforce HTTPS** (once GitHub finishes issuing your free SSL certificate, which usually takes 5-15 minutes).

### Step 5: Configure DNS at Your Domain Registrar
Log into where you bought your `.moe` domain (Namecheap, Porkbun, Cloudflare, Google Domains/Squarespace, etc.) and add the following DNS records:

#### Apex / Root Domain (`yourname.moe`):
Add **4 A Records** pointing to GitHub's IPs:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

#### Subdomain (`www.yourname.moe` or `links.yourname.moe`):
Add a **CNAME Record**:
- **Host / Name**: `www` (or your subdomain)
- **Target / Value**: `<your-github-username>.github.io`

---

## 🎨 Customizing Your Page

### 1. Avatar & Profile Picture
In `index.html`:
```html
<div class="avatar-frame">
  <!-- To use your own image: -->
  <!-- <img src="avatar.png" alt="Avatar" style="width:100%;height:100%;object-fit:cover;"> -->
  <div class="pixel-avatar" id="avatar-preview">
    <span class="avatar-emoji">✨</span>
  </div>
</div>
```
Drop your image into the folder and replace the inner div with an `<img>` tag!

### 2. Social Links
Search for `<div class="links-container">` in `index.html` to update:
- Twitter/X URL
- Bluesky handle
- Discord handle (also update `script.js` line where `handle` is defined for the copy button!)
- GitHub, Spotify, Steam, etc.

### 3. Retro Badges & Stamps (88x31)
Add more 88x31 buttons in the **Badges & Stamps** tab inside `win-about`. You can use CSS badges or insert classic 88x31 gif images from popular archives like [cyber.dabamos.de/88x31](https://cyber.dabamos.de/88x31/).

### 4. Background Wallpaper
Simply drop or replace `wallpaper.webp` in the `meishi/` folder with any 1280×670 (or 16:9) image. It will automatically scale and cover the desktop background. If removed, it will seamlessly fall back to the classic Windows 98 teal (`#008080`).

---

## 🛠️ Installing Git (If Needed)
If you'd like to push via command line and don't have `git` yet, you can install it on Windows via PowerShell:
```powershell
winget install --id Git.Git -e --source winget
```
Once installed, restart your terminal and Git will be ready to use!
