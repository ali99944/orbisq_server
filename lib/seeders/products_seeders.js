import prisma from "../prisma.js";
import products_data from "./data/products.js"

export const product_seeder = async () => {
    try {
        for (let i = 0; i < products_data.length; i++) {
            const data_round = products_data[i];
            for(let j = 0; j < data_round.products.length; j++){
                const product = data_round.products[j];
                await prisma.products.create({
                    data: {
                        name: product.name,
                        price: product.price,
                        description: product.description,
                        product_category_id: data_round.category_id
                    }
                })
            }
        }
    } catch (error) {
        console.log(error)
    }
}

await product_seeder()