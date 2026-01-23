import { prisma } from '@/lib/prisma'
import { MeetingStatus } from '@prisma/client'

export interface CreateMeetingMinuteData {
  meetingDate: Date
  title: string
  content: string
  status?: MeetingStatus
}

export interface UpdateMeetingMinuteData {
  meetingDate?: Date
  title?: string
  content?: string
  status?: MeetingStatus
}

export interface UpdateNextMeetingData {
  meetingDate: Date
  description?: string
}

export interface CreateVoteOptionData {
  title: string
  locationUrl?: string
  isForNextMeeting?: boolean
}

export class MeetingsService {
  static async getMeetingMinutes(status?: MeetingStatus) {
    const where: any = {}
    if (status) {
      where.status = status
    }

    return prisma.meetingMinutes.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        meetingDate: 'desc',
      },
    })
  }

  static async getMeetingMinuteById(id: string) {
    return prisma.meetingMinutes.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })
  }

  static async createMeetingMinute(data: CreateMeetingMinuteData, createdBy: string) {
    return prisma.meetingMinutes.create({
      data: {
        meetingDate: data.meetingDate,
        title: data.title,
        content: data.content,
        status: data.status || 'draft',
        createdBy,
        updatedBy: createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })
  }

  static async updateMeetingMinute(
    id: string,
    data: UpdateMeetingMinuteData,
    updatedBy: string
  ) {
    return prisma.meetingMinutes.update({
      where: { id },
      data: {
        meetingDate: data.meetingDate,
        title: data.title,
        content: data.content,
        status: data.status,
        updatedBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })
  }

  static async archiveMeetingMinute(id: string, updatedBy: string) {
    return prisma.meetingMinutes.update({
      where: { id },
      data: {
        status: 'archived',
        updatedBy,
      },
    })
  }

  static async getNextMeeting() {
    let nextMeeting = await prisma.nextMeeting.findUnique({
      where: { id: '1' },
      include: {
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    // Create if doesn't exist
    if (!nextMeeting) {
      nextMeeting = await prisma.nextMeeting.create({
        data: {
          id: '1',
          meetingDate: new Date(),
          updatedBy: (await prisma.user.findFirst())?.id || '',
        },
        include: {
          updater: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      })
    }

    return nextMeeting
  }

  static async updateNextMeeting(data: UpdateNextMeetingData, updatedBy: string) {
    // Ensure record exists
    const existing = await prisma.nextMeeting.findUnique({
      where: { id: '1' },
    })

    if (!existing) {
      return prisma.nextMeeting.create({
        data: {
          id: '1',
          meetingDate: data.meetingDate,
          description: data.description,
          updatedBy,
        },
        include: {
          updater: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      })
    }

    return prisma.nextMeeting.update({
      where: { id: '1' },
      data: {
        meetingDate: data.meetingDate,
        description: data.description,
        updatedBy,
      },
      include: {
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })
  }

  static async getVoteOptions(isForNextMeeting: boolean = true) {
    return prisma.meetingLocationOption.findMany({
      where: {
        isForNextMeeting,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async createVoteOption(data: CreateVoteOptionData, createdBy: string) {
    return prisma.meetingLocationOption.create({
      data: {
        title: data.title,
        locationUrl: data.locationUrl,
        isForNextMeeting: data.isForNextMeeting ?? true,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })
  }

  static async castVote(userId: string, optionId: string, meetingContext: string = 'next_meeting') {
    // Check if user already voted for this context
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_meetingContext: {
          userId,
          meetingContext,
        },
      },
    })

    if (existingVote) {
      // Update existing vote
      return prisma.vote.update({
        where: { id: existingVote.id },
        data: { optionId },
        include: {
          option: true,
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      })
    }

    // Create new vote
    return prisma.vote.create({
      data: {
        userId,
        optionId,
        meetingContext,
      },
      include: {
        option: true,
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })
  }

  static async getVoteResults(meetingContext: string = 'next_meeting') {
    const options = await prisma.meetingLocationOption.findMany({
      where: {
        isForNextMeeting: meetingContext === 'next_meeting',
      },
      include: {
        votes: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    })

    const results = options.map((option) => ({
      id: option.id,
      title: option.title,
      locationUrl: option.locationUrl,
      voteCount: option.votes.length,
      votes: option.votes.map((vote) => ({
        userId: vote.user.id,
        userName: vote.user.fullName,
        createdAt: vote.createdAt,
      })),
    }))

    // Sort by vote count descending
    results.sort((a, b) => b.voteCount - a.voteCount)

    return {
      meetingContext,
      totalVotes: results.reduce((sum, r) => sum + r.voteCount, 0),
      options: results,
    }
  }
}
