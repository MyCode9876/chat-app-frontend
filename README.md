# MY_CHATBOX - Frontend Web Application

A premium, feature-rich real-time chat application featuring direct messaging, groups, communities, status stories, poll creation, and interactive emoji reactions.

---

## 🛠️ Technology Stack & Packages

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

## 🚀 Key Features & Detailed Operations

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

---

## 🔌 API Endpoints & Feature Mappings

| Feature Area | Endpoint | HTTP Method | Function / UI Mapping |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/auth/signup` | POST | Sign up new user accounts |
| | `/auth/login` | POST | Log in and receive JWT credentials |
| | `/auth/verify-otp` | POST | Confirm mobile OTP token |
| | `/auth/me` | GET | Retrieve currentUser profile object |
| | `/auth/profile` | PUT | Edit name, mobile, address, and about |
| | `/auth/me` | DELETE | Delete own signup account |
| **Directory Search** | `/directory` | GET | List all users in application |
| | `/directory/search` | GET | Filter directory users by query text |
| **Chat Room Actions** | `/chat` | POST | Resolve or create personal/group rooms |
| | `/chat/rooms` | GET | Retrieve conversation list in Sidebar |
| | `/chat/group/:roomId/rename` | PUT | Edit group name |
| | `/chat/group/:roomId/permissions`| PUT | Toggle "only admins can send" settings |
| | `/chat/group/:roomId/add-member` | POST | Add member to group list |
| | `/chat/group/:roomId/remove-member`| DELETE | Remove member from group list |
| **Messages & Uploads**| `/messages` | POST | Send messages, polls, or event metadata |
| | `/messages/:roomId` | GET | Fetch room history messages |
| | `/messages/:messageId` | PUT | Update message content text |
| | `/messages/:messageId` | DELETE | Delete message |
| | `/messages/delete-multiple` | POST | Delete batch of selected messages |
| | `/messages/seen/:roomId` | PUT | Mark all messages in room as read |
| | `/messages/:messageId/pin` | PUT | Pin message |
| | `/messages/:messageId/star` | PUT | Bookmark/star message |
| | `/upload/file` | POST | Upload files/images for attachments |
| **Polls & Reactions** | `/messages/:messageId/vote` | POST | Cast vote in a poll OR apply emoji reaction (indices 1 to 6) |
| **Contacts** | `/contacts` | GET | Load saved user contacts |
| | `/contacts` | POST | Save a directory user as contact |
| **Notifications** | `/notifications` | GET | Fetch unseen notifications |
| | `/notifications/:id` | PUT | Mark a notification as read |
| | `/notifications` | DELETE | Clear all active notifications |

---

## 📡 Real-time Socket.io Events

*   `join_user` - Joins the user to their personal notification channel.
*   `join_room` / `leave_room` - Manages local socket room entry/exit to receive message logs.
*   `send_message` / `receive_message` - Live messaging channels.
*   `typing_status` / `receive_typing` - Dispatches keyup states for status labels.
*   `messages_seen` - Flags status updates to update double checkmarks to blue.
*   `message_edited` / `message_deleted` - Propagates structural text updates and removals.
*   `poll_vote_updated` - Broadcasts vote arrays to update progress metrics and emoji badges instantly.



<!--                                     MY_CHATBOX USER FLOW

                                              
                                              │
                                              ▼
                                     Splash Screen
                               (App Loading & Initialization)
                                              │
                                              ▼
                                    Welcome Screen
                           (Login / Signup Entry Options)
                           ┌────────────────────────────┐
                           │                            │
                           ▼                            ▼
                        Sign Up                      Login
             (Create New Account)         (Existing User Login)
                           │                            │
                           ▼                            │
                   Email Verification                  │
                 (Verify Email using OTP)              │
                           │                            │
                           └──────────────┬─────────────┘
                                          ▼
                                   Home Dashboard
                             (Main Navigation Screen)
────────────────────────────────────────────────────────────────────────────────────────────

 CHATS
│
├── New Chat
│      → Start conversation with any user
│
├── Search Chat
│      → Find chats quickly
│
├── Open Chat
│      │
│      ├── Send Text
│      │      → Send instant messages
│      │
│      ├── Emoji
│      │      → Express reactions
│      │
│      ├── Attachments
│      │      ├── Image
│      │      ├── Video
│      │      ├── Audio
│      │      ├── Document
│      │      └── GIF
│      │      → Share media & files
│      │
│      ├── Reply
│      │      → Reply to specific message
│      │
│      ├── Forward
│      │      → Send message to another chat
│      │
│      ├── Edit
│      │      → Edit within allowed time
│      │
│      ├── Delete
│      │      ├── Delete For Me
│      │      └── Delete For Everyone
│      │
│      ├── Star Message
│      │      → Save important message
│      │
│      ├── Pin Message
│      │      → Keep important message at top
│      │
│      ├── Poll
│      │      → Create voting poll
│      │
│      ├── Emoji Reaction
│      │      → React using emojis
│      │
│      └── Chat Info
│             ├── Media
│             ├── Links
│             ├── Documents
│             ├── Wallpaper
│             ├── Theme
│             ├── Mute
│             └── Disappearing Messages

────────────────────────────────────────────────────────────────────────────────────────────
 CONTACTS

│
├── Search User
│      → Find registered users
│
├── Add Contact
│      → Save contact
│
├── Contact Profile
│      → View user profile
│
├── Start Chat
│      → Open direct chat
│
└── Block Contact
       → Prevent communication

────────────────────────────────────────────────────────────────────────────────────────────

 GROUPS

│
├── Create Group
│      → Create new group
│
├── Select Members
│      → Choose participants
│
├── Group Name & Image
│      → Customize group
│
├── Group Chat
│      │
│      ├── Add Member
│      ├── Remove Member
│      ├── Promote Admin
│      ├── Remove Admin
│      ├── Only Admin Send
│      ├── Group Media
│      ├── Group Settings
│      └── Exit Group

────────────────────────────────────────────────────────────────────────────────────────────

 COMMUNITIES

│
├── Create Community
│      → Create community
│
├── Community Details
│      → Name, Image & Description
│
├── Add Groups
│      → Link multiple groups
│
├── Join Request
│      → Users request access
│
├── Approve / Reject
│      → Admin manages requests
│
├── Community Chat
│      → Announcement & discussion
│
├── Members
│      → View all members
│
└── Community Settings
       → Manage permissions

────────────────────────────────────────────────────────────────────────────────────────────

 STATUS
│
├── Upload Image
├── Upload Video
├── Text Status
│      → Share story
│
├── View Status
│      → Watch friends' stories
│
├── Reply
│      → Reply privately
│
├── Seen List
│      → Check viewers
│
└── Delete Status
       → Remove story

────────────────────────────────────────────────────────────────────────────────────────────

 SETTINGS

│
├── Profile
│      → Edit profile details
│
├── Privacy
│      ├── Last Seen
│      ├── Profile Photo
│      ├── About
│      ├── Read Receipts
│      ├── Blocked Users
│      └── Disappearing Messages
│
├── Notifications
│      ├── Chat Notification
│      ├── Group Notification
│      ├── Community Notification
│      ├── Status Notification
│      └── Notification Sound
│
├── Chats
│      ├── Chat Theme
│      ├── Wallpaper
│      ├── Font Size
│      └── Default Chat Settings
│
├── Language
│      → Change application language
│
├── Storage
│      → Manage downloaded files
│
├── Security
│      → Account & login security
│
├── Help & Support
│      → Contact support
│
├── About
│      → App information
│
└── Logout
       → Securely sign out

────────────────────────────────────────────────────────────────────────────────────────────

 NOTIFICATIONS

├── Chat Notifications
├── Group Notifications
├── Community Notifications
├── Status Updates
├── Email Verification Reminder
└── Mark All Read

────────────────────────────────────────────────────────────────────────────────────────────

 REAL-TIME FEATURES

Socket Connected
      │
      ├── Instant Messaging
      ├── Typing Indicator
      ├── Read Receipts
      ├── Live Emoji Reactions
      ├── Live Poll Updates
      ├── Group Updates
      ├── Community Updates
      └── Instant Notifications
      
      
 -->
