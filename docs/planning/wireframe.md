# Wireframe Reference Doc

## ASCII / Markdown Mock-ups

```text
+----------------------------------------------------------+
| Sidebar           |  Dashboard                           |
|-------------------|--------------------------------------|
| • Dashboard       |  [Welcome + Quick Stats]            |
| • Upload          |  [Recently Uploaded Documents]      |
| • My Documents    |  [Processing Status Widgets]        |
| • Categories      |  [Quick Actions: Upload, Search]    |
| • Search          |                                      |
| • Ask AI          |                                      |
| • Settings        |                                      |
|-------------------|                                      |
| [Usage: 45/100]   |                                      |
+-------------------+--------------------------------------+

Upload Page `/upload`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  Upload Documents                    |
|-------------------|--------------------------------------|
| [same nav]        |  [Drag & Drop Zone]                 |
|                   |  [Upload Progress Bars]             |
|                   |  [File Format Support Info]         |
|                   |  [Bulk Upload Options]              |
+-------------------+--------------------------------------+

My Documents `/documents`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  My Documents                        |
|-------------------|--------------------------------------|
| [same nav]        |  [Filter Bar: Category, Date, Type] |
|                   |  [Grid/List View Toggle]            |
|                   |  [Document Cards with Preview]      |
|                   |  [Bulk Action Toolbar]              |
+-------------------+--------------------------------------+

Categories `/categories`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  Document Categories                 |
|-------------------|--------------------------------------|
| [same nav]        |  [Auto-Generated Smart Folders]     |
|                   |  • Invoices (23 docs)               |
|                   |  • Contracts (8 docs)               |
|                   |  • Receipts (156 docs)              |
|                   |  [+ Create Custom Category]         |
+-------------------+--------------------------------------+

Search Page `/search`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  Intelligent Search                  |
|-------------------|--------------------------------------|
| [same nav]        |  [Natural Language Search Bar]      |
|                   |  [Advanced Filters Panel]           |
|                   |  [Search Results with Relevance]    |
|                   |  [Saved Searches]                   |
+-------------------+--------------------------------------+

Ask AI Page `/ask`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  Document Q&A                        |
|-------------------|--------------------------------------|
| [same nav]        |  [Chat Interface]                    |
|                   |  [Question Input Box]               |
|                   |  [AI Responses with Doc Citations]  |
|                   |  [Suggested Questions]              |
+-------------------+--------------------------------------+

Landing Page `/` (marketing)
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Login | Sign Up                  |
|----------------------------------------------------------|
| [Hero: "Stop wasting hours searching for documents"]    |
| [Feature Showcase: Auto-classify, Smart Search, AI Q&A] |
| [Pricing Tiers: Free, Professional, Business]          |
| [Social Proof: Time Savings Testimonials]              |
| [CTA: "Start Organizing Free"]                          |
+----------------------------------------------------------+

Settings/Profile `/settings/profile`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  Account Settings                    |
|-------------------|--------------------------------------|
| [same nav]        |  [Personal Information Form]        |
|                   |  [Business Details]                 |
|                   |  [Notification Preferences]         |
|                   |  [Security Settings]                |
+-------------------+--------------------------------------+

Settings/Subscription `/settings/subscription`
+----------------------------------------------------------+
| Header: Filyx.ai Logo | Search | Profile                 |
|----------------------------------------------------------|
| Sidebar           |  Subscription Management             |
|-------------------|--------------------------------------|
| [same nav]        |  [Current Plan Details]             |
|                   |  [Usage Statistics & Limits]        |
|                   |  [Upgrade/Downgrade Options]        |
|                   |  [Billing History]                  |
+-------------------+--------------------------------------+
```

## Navigation Flow Map

```
Landing `/` → Sign Up `/auth/sign-up` → Sign Up Success → Dashboard `/dashboard`
           → Login `/auth/login` → Dashboard `/dashboard`

Dashboard `/dashboard` → Upload `/upload` → Processing Status
                      → My Documents `/documents` → Document Detail Modal
                      → Categories `/categories` → Category View
                      → Search `/search` → Search Results
                      → Ask AI `/ask` → Q&A Chat Interface
                      → Settings `/settings/profile`
                      → Settings `/settings/subscription` → Billing History
                                                          → Payment Methods

Admin Flow (Business Tier):
Dashboard → Admin `/admin` → Users `/admin/users` → User Detail
                          → Analytics `/admin/analytics`
                          → System Settings `/admin/settings`

Document Workflow:
Upload → Auto-Classification → Categories → Manual Review (if needed)
      → My Documents → Search/Filter → Document Actions (view, download, delete)
      → Ask AI → RAG-powered Q&A about document content

Authentication:
Any Protected Page → Login (if not authenticated) → Intended Destination
Forgot Password `/auth/forgot-password` → Password Reset Email → New Password
```
