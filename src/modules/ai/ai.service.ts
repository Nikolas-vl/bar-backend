

//async function searchDishes(query: string) {
//  // 1. Перевіряємо та очищаємо вхідний текст
//  const cleanQuery = validateQuery(query);

//  // 2. Створюємо embedding запиту
//  const embedding = await createEmbedding(cleanQuery);

//  // 3. Шукаємо схожі страви в PostgreSQL
//  const candidates = await findSimilarDishes(embedding);

//  // 4. Перевіряємо бізнес-умови
//  return filterAvailableDishes(candidates);
//}
