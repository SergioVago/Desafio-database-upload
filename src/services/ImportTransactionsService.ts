import csv from 'csv-parser';
import fs from 'fs';
import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(file: Express.Multer.File): Promise<Transaction[]> {
    try {
      const transactionRepository = getRepository(Transaction);
      const transactions: Transaction[] = [];
      const createTransaction = new CreateTransactionService();

      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (csvTransaction: CSVTransaction) => {
          const {
            title,
            value,
            type,
            category: category_name,
          } = csvTransaction;

          createTransaction
            .execute(
              {
                title,
                value,
                type,
                category_name,
              },
              false,
            )
            .then(transaction => {
              transactionRepository.save(transaction);
              transactions.push(transaction);
            });
        })
        .on('end', () => {
          console.log('CSV file successfully processed');
        });

      return transactions;
    } catch (err) {
      throw new AppError(err.message, 400);
    }
  }
}

export default ImportTransactionsService;
