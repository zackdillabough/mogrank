// Discord DM functionality using REST API
// This avoids the bundling issues with discord.js in Next.js

const DISCORD_API_URL = "https://discord.com/api/v10"

async function createDMChannel(userId: string): Promise<string | null> {
  try {
    const response = await fetch(`${DISCORD_API_URL}/users/@me/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    })

    if (!response.ok) {
      console.error("Failed to create DM channel:", await response.text())
      return null
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error("Error creating DM channel:", error)
    return null
  }
}

async function sendMessage(channelId: string, content: string): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API_URL}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      console.error("Failed to send message:", await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending message:", error)
    return false
  }
}

export async function sendDiscordDM(
  discordId: string,
  message: string
): Promise<boolean> {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn("DISCORD_BOT_TOKEN not set, skipping DM")
    return false
  }

  const channelId = await createDMChannel(discordId)
  if (!channelId) {
    return false
  }

  const success = await sendMessage(channelId, message)
  if (success) {
    console.log(`DM sent to ${discordId}`)
  }
  return success
}

export async function sendQueueUpdateDM(
  discordId: string,
  update: {
    type: "scheduled" | "room_code" | "in_progress" | "completed" | "missed"
    packageName: string
    appointmentTime?: string
    roomCode?: string
  }
): Promise<boolean> {
  let message = ""

  switch (update.type) {
    case "scheduled":
      message = `Your **${update.packageName}** boost has been scheduled for **${update.appointmentTime}**! Make sure to be ready.`
      break
    case "room_code":
      message = `Your boost session is ready! Join with room code: \`${update.roomCode}\`\n\nPackage: **${update.packageName}**`
      break
    case "in_progress":
      message = `Your **${update.packageName}** boost session has started! Stay AFK and enjoy the ride.`
      break
    case "completed":
      message = `Your **${update.packageName}** boost has been completed! Enjoy your new levels. Thanks for using mogrank!`
      break
    case "missed":
      message = `You missed your scheduled **${update.packageName}** boost appointment. Please contact us to reschedule.`
      break
  }

  return sendDiscordDM(discordId, message)
}
