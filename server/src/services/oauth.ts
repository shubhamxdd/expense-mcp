import { google } from 'googleapis'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

export function getAuthUrl(): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2 = getOAuth2Client()
  const { tokens } = await oauth2.getToken(code)
  return tokens
}

export async function getUserInfo(accessToken: string) {
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ access_token: accessToken })
  const oauth2api = google.oauth2({ version: 'v2', auth: oauth2 })
  const { data } = await oauth2api.userinfo.get()
  return data
}

export async function createSpreadsheet(accessToken: string, userName: string) {
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ access_token: accessToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2 })

  const { data } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: `Expense Tracker — ${userName}` },
    },
  })

  const spreadsheetId = data.spreadsheetId!
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Sheet1!A1:G1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'date', 'amount', 'tags', 'note', 'created_at', 'deleted_at']],
    },
  })

  return spreadsheetId
}

export function getRefreshedAuth(refreshToken: string) {
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ refresh_token: refreshToken })
  return oauth2
}