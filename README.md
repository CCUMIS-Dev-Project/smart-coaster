# smart-coaster

### to co-work on these project
1. clone it first
  1. git clone <repository-url>
  2. cd <to the folder you would like to work on>
2. when you are going to push
  1. Create and switch to new branch:   git checkout -b <branch name>
  2. Add all files: git add .
  3. Commit: git commit -m "Add smart coaster dashboard with mock sensor data"
  4. Push to remote: git push -u origin <branch name>

## About API 
*confidential and sensitive*, NEVER be exposed in frontend code

## To test the project on expo go, web 
* cd front
* npm install
* npx expo start

-> 若需更新 npx expo install expo@latest

## Project Structure 
  ```                                                                           
  smart-coaster/ 
  ├── front/                  # React Native + Expo frontend
  │   ├── App.js              # Entry point - renders main screen
  │   ├── app.json            # Expo config (app name, icons, SDK)
  │   ├── package.json        # Dependencies and scripts
  │   └── src/
  │       ├── screens/        # Full page views
  │       │   └── DashboardScreen.js  # Main sensor display
  │       ├── components/     # Reusable UI components
  │       │   ├── VolumeDisplay.js    # Current volume (ml)
  │       │   ├── VolumeHistory.js    # Recent readings list
  │       │   └── StatusIndicator.js  # Cup placed/empty
  │       ├── services/       # API and data services
  │       │   ├── api.js              # Backend API calls
  │       │   └── mockSensorData.js   # Mock data (replace with real API)
  │       ├── config/
  │       │   └── config.js           # API URLs, endpoints
  │       └── assets/         # Images, fonts
  │
  └── back/                   # Flask backend
  │   ├── app.py              # Server (port 5000)
  │   ├── routes/             # API route handlers
  │   └── .env                # API keys (confidential)
  └── .gitignore
  │
  └── README.md
  ```

  ## Where to Modify (Frontend)

  | Task | File(s) |
  |------|---------|
  | Add new page | `front/src/screens/` |
  | Add component | `front/src/components/` |
  | Connect real sensor | `front/src/services/mockSensorData.js` |
  | Change backend URL | `front/src/config/config.js` |
  | Add navigation | `front/App.js` |
