import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_name: string;
}

class CreateTransactionService {
  public async execute(
    { title, value, type, category_name }: Request,
    checkBalance = true,
  ): Promise<Transaction> {
    let category;

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (checkBalance) {
      const balance = await transactionsRepository.getBalance();
      if (type === 'outcome' && balance.total - value < 0) {
        throw new AppError('Invalid balance', 400);
      }
    }

    const categoriesRepository = getRepository(Category);

    const findedCategoryByName = await categoriesRepository.findOne({
      where: { title: category_name },
    });

    if (!findedCategoryByName) {
      const newCategory = categoriesRepository.create({
        title: category_name,
      });
      await categoriesRepository.save(newCategory);

      category = newCategory;
    } else {
      category = findedCategoryByName;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
