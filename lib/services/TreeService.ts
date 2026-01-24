import { prisma } from '@/lib/prisma'
import { Gender, HouseholdMemberRole, RelationType } from '@prisma/client'

export interface CreatePersonData {
  fullName: string
  gender: Gender
  birthDate?: Date
  deathDate?: Date
  photoFileId?: string
  notes?: string
}

export interface CreateHouseholdData {
  title?: string
  members?: Array<{
    personId: string
    role: HouseholdMemberRole
    isPrimarySpouse?: boolean
  }>
}

export interface CreateRelationshipData {
  personId1: string
  personId2: string
  relationType: RelationType
  startDate?: Date
  endDate?: Date
}

export interface LinkHouseholdsData {
  childHouseholdId: string
  parentHouseholdId: string
  linkViaPersonId: string
  viaSide?: 'father_side' | 'mother_side'
}

export class TreeService {
  static async getTreeStructure() {
    // جلب الأشخاص مع معلومات الأب والأم
    const persons = await prisma.person.findMany({
      include: {
        photoFile: true,
        father: {
          select: { id: true, fullName: true },
        },
        mother: {
          select: { id: true, fullName: true },
        },
        primaryFamily: {
          include: {
            members: {
              include: {
                person: {
                  include: {
                    photoFile: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // جلب الأسر مع أعضائها
    const households = await prisma.household.findMany({
      include: {
        members: {
          include: {
            person: {
              include: {
                photoFile: true,
                father: {
                  select: { id: true, fullName: true },
                },
                mother: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
        childLinks: {
          include: {
            parentHousehold: true,
            linkViaPerson: true,
          },
        },
        parentLinks: {
          include: {
            childHousehold: true,
            linkViaPerson: true,
          },
        },
      },
    })

    const relationships = await prisma.relationship.findMany({
      include: {
        person1: true,
        person2: true,
      },
    })

    // تحويل households إلى families. الروابط كـ IDs فقط (بدون كائنات متداخلة)
    // لمنع مراجع دائرية → Maximum call stack في الواجهة.
    const families = households.map((household) => ({
      id: household.id,
      title: household.title,
      members: household.members.map((member) => ({
        id: `${household.id}-${member.personId}`,
        person: {
          id: member.person.id,
          fullName: member.person.fullName,
          gender: member.person.gender,
          birthDate: member.person.birthDate?.toISOString?.() ?? null,
          fatherId: member.person.fatherId ?? undefined,
          motherId: member.person.motherId ?? undefined,
          primaryFamilyId: member.person.primaryFamilyId ?? undefined,
        },
        role: member.role,
        isPrimarySpouse: member.isPrimarySpouse ?? false,
      })),
      childLinks: (household.childLinks || []).map((l) => ({
        childHouseholdId: l.childHouseholdId,
        parentHouseholdId: l.parentHouseholdId,
      })),
      parentLinks: (household.parentLinks || []).map((l) => ({
        childHouseholdId: l.childHouseholdId,
        parentHouseholdId: l.parentHouseholdId,
      })),
    }))

    return {
      persons,
      families,
      households: families, // نفس البنية المُصحّحة (بدون تداخل) للتوافق
      relationships,
    }
  }

  static async getPersonDetails(id: string) {
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        photoFile: true,
        householdMembers: {
          include: {
            household: {
              include: {
                members: {
                  include: {
                    person: true,
                  },
                },
              },
            },
          },
        },
        relationships1: {
          include: {
            person2: true,
          },
        },
        relationships2: {
          include: {
            person1: true,
          },
        },
      },
    })

    return person
  }

  static async createPerson(data: CreatePersonData) {
    return prisma.person.create({
      data: {
        fullName: data.fullName,
        gender: data.gender,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        photoFileId: data.photoFileId,
        notes: data.notes,
      },
      include: {
        photoFile: true,
      },
    })
  }

  static async updatePerson(id: string, data: Partial<CreatePersonData>) {
    return prisma.person.update({
      where: { id },
      data: {
        fullName: data.fullName,
        gender: data.gender,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        photoFileId: data.photoFileId,
        notes: data.notes,
      },
      include: {
        photoFile: true,
      },
    })
  }

  static async deletePerson(id: string) {
    // Check if person has relationships or household members
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        householdMembers: true,
        relationships1: true,
        relationships2: true,
      },
    })

    if (!person) {
      throw new Error('الشخص غير موجود')
    }

    if (person.householdMembers.length > 0 || person.relationships1.length > 0 || person.relationships2.length > 0) {
      throw new Error('لا يمكن حذف شخص له علاقات أو ينتمي لأسرة')
    }

    return prisma.person.delete({
      where: { id },
    })
  }

  static async createHousehold(data: CreateHouseholdData) {
    return prisma.household.create({
      data: {
        title: data.title,
        members: data.members
          ? {
              create: data.members.map((member) => ({
                personId: member.personId,
                role: member.role,
                isPrimarySpouse: member.isPrimarySpouse || false,
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            person: true,
          },
        },
      },
    })
  }

  static async updateHousehold(id: string, data: Partial<CreateHouseholdData>) {
    return prisma.household.update({
      where: { id },
      data: {
        title: data.title,
      },
      include: {
        members: {
          include: {
            person: true,
          },
        },
      },
    })
  }

  static async addHouseholdMember(householdId: string, personId: string, role: HouseholdMemberRole, isPrimarySpouse: boolean = false) {
    return prisma.householdMember.create({
      data: {
        householdId,
        personId,
        role,
        isPrimarySpouse,
      },
      include: {
        person: true,
        household: true,
      },
    })
  }

  static async removeHouseholdMember(householdId: string, personId: string) {
    return prisma.householdMember.delete({
      where: {
        householdId_personId: {
          householdId,
          personId,
        },
      },
    })
  }

  static async linkHouseholds(data: LinkHouseholdsData) {
    return prisma.householdLink.create({
      data: {
        childHouseholdId: data.childHouseholdId,
        parentHouseholdId: data.parentHouseholdId,
        linkViaPersonId: data.linkViaPersonId,
        viaSide: data.viaSide,
      },
      include: {
        childHousehold: true,
        parentHousehold: true,
        linkViaPerson: true,
      },
    })
  }

  static async unlinkHouseholds(childHouseholdId: string) {
    return prisma.householdLink.delete({
      where: { childHouseholdId },
    })
  }

  static async createRelationship(data: CreateRelationshipData) {
    return prisma.relationship.create({
      data: {
        personId1: data.personId1,
        personId2: data.personId2,
        relationType: data.relationType,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        person1: true,
        person2: true,
      },
    })
  }

  static async deleteRelationship(id: string) {
    return prisma.relationship.delete({
      where: { id },
    })
  }

  static async searchPersons(query: string) {
    const trimmed = (query || '').trim()
    const take = 500
    const include = {
      photoFile: true,
      householdMembers: { include: { household: true } },
    }
    if (!trimmed) {
      return prisma.person.findMany({
        orderBy: { fullName: 'asc' },
        include,
        take,
      })
    }
    return prisma.person.findMany({
      where: { fullName: { contains: trimmed } },
      include,
      take: 50,
    })
  }
}
