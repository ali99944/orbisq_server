import { getCurrentDate } from "../../lib/date"
import prisma from "../../lib/prisma"

interface Category {
    name: string
    image: string
}

const categories: Category[] = []

export async function seed_categories() {
    await prisma.categories.deleteMany()


    await Promise.all(
        categories.map(async (genre) => {
            await prisma.categories.create({
                data: {
                    name: genre.name,
                    image: genre.image,
                    created_at: getCurrentDate()
                }
            })
        })
    )
}
