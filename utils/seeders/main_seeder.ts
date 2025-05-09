import { seed_categories } from "./category_seeder";


async function seeder(){    
    await seed_categories()
}

try {
    await seeder()
    console.log('All tables seeded successfully');
    
} catch (error) {
    console.log(error);
    process.exit(0)
}