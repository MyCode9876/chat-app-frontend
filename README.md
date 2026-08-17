# MY_CHATBOX - Frontend Web Application

A premium, feature-rich real-time chat application featuring direct messaging, groups, communities, status stories, poll creation, and interactive emoji reactions.

---

##  Technology Stack & Packages

The frontend is built using a modern, fast, and interactive stack:

### Core Framework
*   **Next.js (v14.2.4)** - React Framework with App Router, static generation, and client-side rendering.
*   **React (v18.3.1)** - Component-based user interface library.

### Styling & UI Design
*   **Vanilla CSS + Tailwind CSS (v3.4.4)** - Responsive design utility classes combined with custom stylesheets for premium glassmorphism, dark/light themes, and custom styling.
*   **Material-UI (MUI v5.15.20)** - Used for modern icons and theme/UI primitives.
*   **Lucide React** & **React Icons** - Clean vector icons for UI navigation and controls.

### State & Real-Time Communication
*   **Socket.IO Client (v4.7.5)** - Bidirectional, low-latency, real-time events for instant messages, typing indicators, read receipts, and poll updates.
*   **Axios** - HTTP client used for REST API requests with authorization headers.

### Animation Packages
*   **Framer Motion (v11.3.2)** - (Recently Integrated) Premium motion library used to animate the entry, hover scaling, tap press, and exit transitions of the Floating Emoji Reactions Bar.
*   **Vanilla CSS Keyframes** - Hand-crafted micro-animations for message highlights (`highlight-flash`), emoji bounce/zoom (`animate-emoji-zoom`), and fade-in states.

### Emoji Pickers
*   **Emoji Picker React (v4.19.1)** - Interactive picker panel embedded in the attachment drawer for inserting emojis into messages and search inputs.

---

##  Key Features & Detailed Operations

### 1. User Authentication & Profile Settings
*   **Registration & OTP Verification:** Register users with mobile/email and verify via OTP checks.
*   **Authentication State:** Persistent session validation using JWT tokens in `localStorage`.
*   **Profile Personalization:** Edit First Name, Last Name, About status, Address, Mobile, and upload custom Profile Images.
*   **Account Deletion:** Permanently purge authentication profile data.

### 2. Direct Messaging & Real-Time Chatting
*   **Instant Messages:** Message delivery and retrieval with zero delay.
*   **Typing Indicators:** real-time tracking showing `[Name] is typing...` when the partner focuses the input field.
*   **Read Receipts:** Double checkmark indicator changing color (blue tick) when a message is marked as seen.
*   **Disappearing Messages:** Automatically hides/filters messages older than a selected duration (24 Hours, 7 Days, 90 Days) based on local preferences.

### 3. Group Conversations
*   **Group Creation:** Create group rooms, select initial members, and assign custom names.
*   **Admin Management:** Promote members, remove members, and restrict permissions.
*   **Only-Admin-Send-Settings:** Toggle configuration allowing only group admins/creators to broadcast messages.
*   **Group Avatars:** Update group icons.

### 4. Community Rooms & Sub-groups
*   **Communities:** Large channel groups representing parent communities.
*   **Linked Sub-groups:** Connect custom group chats under a single community room wrapper.
*   **Access Control:** Community join requests and admin authorization panel.

### 5. Advanced Message Management
*   **Pin Messages:** Pin important statements/files to the top of the chat panel.
*   **Star Messages:** Star specific messages to save them in a personal bookmarked drawer.
*   **Edit Message:** Allows editing messages within 15 minutes of transmission (appends an `(edited)` italic tag).
*   **Delete Message:** Dual options to delete messages locally ("Delete for Me") or delete them for everyone in the room.
*   **Forward Messages:** Select one or multiple messages and forward them directly to other active chat rooms.
*   **File Attachments:** Share HD Images, GIF loops, Documents (PDF/Doc/Zip), Audio clips, or Videos. Supports drag-and-drop file upload.

### 6. Interactive Polls & Emoji Reactions
*   **Poll Creation:** Build single or multi-choice poll questions. Shows live progression tracks of votes.
*   **Emoji Reactions:** React directly to any chat message by long-pressing or double-clicking. Shows a floating panel with: 👍, ❤️, 😂, 😮, 😢, 🙏.
*   **Framer Motion Animation:** The reaction bar smoothly slides up, scales from zero, and reacts with micro-bounces on hover.

### 7. Status Stories (Stories Viewer)
*   **Status Logs:** Share status updates (text or media formats) which remain active for contacts to view.
