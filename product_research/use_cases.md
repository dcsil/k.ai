# Use Cases

## JTBD 1 - (CUJs 1, 2, 3, 5):

As an independent musician, I want to be able to keep track of every task that needs to be done so that I can stay organized on the path to a successful release.

### Functional Requirements
 - Data
   - Release strategy
     - For our MVP, we will only have one release strategy to reduce complexity. Although we want to offer strategic guidance, we will focus on improving the user’s only strategy. Our final product will support multiple.
     - A release strategy has the following:
         - A name
         - A list of associated tasks
   - Tasks
     - Each task has the following:
         - A title (e.g. “Announce release date”)
         - A deadline
         - Status (Not Started, In Progress, Completed)
         - Notes
   - Progress (something that shows how much the release strategy is done so far)
 - Integrations
   - Our final can integrate with to-do list and / or calendar apps that the artist may already use. Our MVP will not have integrations for this JTBD in the interest of time. 
 - Core functionalities
   - For MVP
     - Our platform will assist the user in finishing tasks before their deadlines
         - This is especially true for tasks before the final release deadline
     - The user can keep track of and manage (create, edit, and delete) tasks
     - The user can see a list of tasks
         - The list will be logically organized 
     - If the release strategy changes or a task end up taking longer than expected, the user can update their task list easily to adjust
     - The user receives guidance on tasks to include in their strategy
   - For final product
     - Newly created release tasks helps to advance the release strategy
     - The user can see which tasks require their attention

### Non-Functional Requirements
- Performance
   - Updates to the tasks and progress bar happen instantaneously from the user’s perspective
   - A maximum of 500 tasks are supported
   - UI updates must reflect within 100ms of user action
   - Supported for latest 2 versions of Chrome, Safari, Firefox, Edge
- UX
   - All task details can be modified on the task list and/or in the task-specific dropdown
   - In the final product, an error message is displayed when the maximum number number of tasks is reached
   - Realization of core functionalities in MVP (from functional requirements)
      - Core functionality: Our platform will assist the user in finishing tasks before their deadlines (or completing it soon after the deadlines)
         - Realization in MVP: Tracking deadlines will help.
      - The user can see a list of tasks, logically organized 
         - The list will be organized by due date
      - The user receives guidance on tasks to include in their strategy
         - The typical steps (for pre-release, release day, and post-release) are the tasks that are added by default to the timeline


## JTBD 2 - (CUJs 4, 5):

As a musician who is planning to release or has just released a new song, I want to efficiently promote it on all my social media profiles/pages, so that I can expand my following for better marketing.

### Functional Requirements
- Data:
   - Social Media Posts
      - Each post contains:
         - Content (text, media files)
         - Target platforms (array of platform IDs)
         - Publishing status (Draft, Scheduled, Published)
         - Scheduled time in a calendar
         - Actual published time
         - Platform-specific metadata (hashtags, mentions, etc)
   - Social media account connections
      - OAuth tokens for each connected platform
      - Account usernames
      - Connection Status (and last refresh time)
- Integrations:
   - OAuth integration with major social media platforms:
      - Instagram: Meta API
      - X (Twitter) API
      - Tik Tok API
      - Facebook Graph API
   - For MVP: at least 2-3 major platforms
   - Long-term: include all platforms listed above
- Core Functionalities
   - User can create posts with text and media content
   - User can select multiple platforms for simultaneous posting
   - User can schedule posts for future date and time
   - User can edit or cancel scheduled posts before they are posted
   - User receives confirmation when posts are successfully posted
   - System handles platform-specific requirements (character limits)
   - User can save post drafts

### Non-Functional Requirements
- Performance
   - Post publishing should complete within 10 seconds for immediate posts
   - Scheduled posts should publish within 60 seconds of scheduled time
   - Media uploads should support files up to 50 MB with progress indicator for files larger than 5 MB
- UX
   - All social media features should be accessible within 2 clicks from the dashboard
   - Clear error message if platform connection fails
   - Visual feedback during upload/publishing processes


## JTBD 3 - (CUJs 5, 6):

Note: This JTBD is mostly about the infrastructural services to our platform. Things like support for users will likely be added in the backend regardless of if we mention it here or not, so we might as well put it here.

As an emerging artist, I want the platform I use to have a clean and intuitive interface, plus simple and affordable payment options, so that I can save time and money to focus on the music itself.

### Functional Requirements
- The user can manage both the release tasks and their social media posts
- DB and backend capable of handling multiple users.
- Stateless REST APIs
- Use tokens or SSO for signing in.
- A way to change and reset passwords.
- User profiles and preferences are synced automatically between sessions and devices.
- Designed in a way to leave room for future feature expansions.
- (long-term) CAPTHA during registration and rate-limits in the backend to prevent abuse.
- (long-term) Connects to third-party billing APIs
### Non-Functional Requirements
- In order for the user to manage both the release tasks and their social media posts, our platform will make it easy to switch between the two pages
- Backend and DB performant enough to respond to a simple request within 200ms (not including network delay)
   - For complex requests that requires wait time over 500ms, show loading animation/progress bar to let user know
- Multiple users on different profiles can use the service at the same time.
- UX
   - All features described under this JTBD/CUJ are reachable in some way within 2 layers of menus.
- (MVP) Backend + DB should be hostable locally / cost within the free tier limits of our cloud provider.
- (long-term) Customers with saved payment details can complete a transaction within 30s.
     

<!-- At least 3, and no more than 6 use cases should be specified -->
