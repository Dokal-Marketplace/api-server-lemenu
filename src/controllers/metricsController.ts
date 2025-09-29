import { Request, Response, NextFunction } from "express"
import { getDashboardMetrics } from "../services/metricsService"

export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: string[] = []
    const { localId, subDomain, month, year } = req.query

    if (localId !== undefined && typeof localId !== "string") {
      errors.push("localId must be a string")
    }
    if (subDomain !== undefined && typeof subDomain !== "string") {
      errors.push("subDomain must be a string")
    }
    if (month !== undefined) {
      const mNum = Number(month)
      if (!Number.isFinite(mNum) || mNum < 1 || mNum > 12) {
        errors.push("month must be a number between 1 and 12")
      }
    }
    if (year !== undefined) {
      const yNum = Number(year)
      if (!Number.isFinite(yNum) || yNum < 1970 || yNum > 2100) {
        errors.push("year must be a number between 1970 and 2100")
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({ type: "0", message: "Validation error", errors })
    }

    const data = await getDashboardMetrics({
      localId: req.query.localId as string | undefined,
      subDomain: req.query.subDomain as string | undefined,
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
    })
    return res.json(data)
  } catch (error) {
    next(error)
  }
}
