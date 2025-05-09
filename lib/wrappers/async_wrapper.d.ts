import { Request, Response, NextFunction } from 'express';


declare type AsyncWrapperFunction = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => (req: Request, res: Response, next: NextFunction) => Promise<void>;

declare const asyncWrapper: AsyncWrapperFunction;

export default asyncWrapper;