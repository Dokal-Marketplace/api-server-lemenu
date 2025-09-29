import logger from "../utils/logger"

type MetricCard = {
  formattedValue: string
  value: number
  percentage?: number
}

type WeeklySalesWeek = {
  metadata: {
    startDate: string
    endDate: string
  }
  weekData: {
    summary: {
      formattedTotal: string
      total: number
      compareLastWeek: number
    }
    sales: Array<{
      day: string
      fullDay: string
      value: number
      formattedValue: string
      compareLastWeek: number
    }>
  }
}

type HourlyDatum = {
  hour: string
  value: number
  formattedValue: string
  orders: number
  averageTicket: number
}

const CURRENCY_PREFIX = "S/"

function formatCurrency(value: number): string {
  return `${CURRENCY_PREFIX} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-PE")
}

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const DAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
]
const MONTHS_FULL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function buildWeeklySales(referenceDate: Date, weeks: number = 4): WeeklySalesWeek[] {
  const result: WeeklySalesWeek[] = []
  let cursor = new Date(referenceDate)
  for (let i = 0; i < weeks; i++) {
    const { start, end } = getWeekRange(cursor)
    const dailyValues = Array.from({ length: 7 }).map((_, idx) => {
      const value = 900 + (i * 7 + idx) * 35.5
      return {
        value,
        formattedValue: formatCurrency(value),
      }
    })
    const sales = dailyValues.map((dv, idx) => ({
      day: DAYS_SHORT[idx],
      fullDay: DAYS_FULL[idx],
      value: Number(dv.value.toFixed(2)),
      formattedValue: dv.formattedValue,
      compareLastWeek: Number((Math.random() * 20 - 10).toFixed(1)),
    }))
    const total = Number(
      sales.reduce((sum, s) => sum + s.value, 0).toFixed(2)
    )
    result.push({
      metadata: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      weekData: {
        summary: {
          formattedTotal: formatCurrency(total),
          total,
          compareLastWeek: Number((Math.random() * 30 - 10).toFixed(1)),
        },
        sales,
      },
    })
    cursor = new Date(start)
    cursor.setDate(start.getDate() - 1)
  }
  return result.reverse()
}

function buildHourlySales(days: number = 3): Record<string, HourlyDatum[]> {
  const result: Record<string, HourlyDatum[]> = {}
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const hours: HourlyDatum[] = []
    for (let h = 0; h < 24; h++) {
      const hourStr = `${String(h).padStart(2, "0")}:00`
      const value = Number((50 + Math.random() * 300).toFixed(2))
      const orders = Math.floor(1 + Math.random() * 20)
      const averageTicket = Number((value / Math.max(orders, 1)).toFixed(2))
      hours.push({
        hour: hourStr,
        value,
        formattedValue: formatCurrency(value),
        orders,
        averageTicket,
      })
    }
    result[key] = hours
  }
  return result
}

function buildMonthlyMetrics(_year: number): Array<{
  month: string
  monthNumber: number
  sales: number
  orders: number
  views: number
  averageTicket: number
}> {
  return Array.from({ length: 12 }).map((_, idx) => {
    const monthNumber = idx + 1
    const base = 20000 + idx * 1500
    const sales = Number((base + Math.random() * 8000).toFixed(2))
    const orders = Math.floor(900 + idx * 40 + Math.random() * 500)
    const views = Math.floor(30000 + idx * 2000 + Math.random() * 15000)
    const averageTicket = Number((sales / Math.max(orders, 1)).toFixed(2))
    return {
      month: MONTHS_FULL[idx],
      monthNumber,
      sales,
      orders,
      views,
      averageTicket,
    }
  })
}

export async function getDashboardMetrics(params: {
  localId?: string
  subDomain?: string
  month?: number
  year?: number
}) {
  const { localId, subDomain, month: monthParam, year: yearParam } = params

  const now = new Date()
  const year = Number.isFinite(yearParam) && (yearParam as number) > 0 ? (yearParam as number) : now.getFullYear()
  const month =
    Number.isFinite(monthParam) && (monthParam as number) >= 1 && (monthParam as number) <= 12
      ? (monthParam as number)
      : now.getMonth() + 1

  logger.info(
    `Dashboard metrics requested: localId=${localId ?? "-"}, subDomain=${
      subDomain ?? "-"
    }, month=${month}, year=${year}`
  )

  const salesDay = 1250.5
  const salesMonth = 25680.75
  const salesYear = 185420.3

  const ordersDay = 45
  const ordersMonth = 1234
  const ordersYear = 8567

  const viewsDay = 2345
  const viewsMonth = 45678
  const viewsYear = 234567

  const avgTicketDay = 27.8
  const avgTicketMonth = 20.82
  const avgTicketYear = 21.64

  const sales: { day: MetricCard; month: MetricCard; year: MetricCard } = {
    day: {
      formattedValue: formatCurrency(salesDay),
      value: salesDay,
      percentage: 15.2,
    },
    month: {
      formattedValue: formatCurrency(salesMonth),
      value: salesMonth,
    },
    year: {
      formattedValue: formatCurrency(salesYear),
      value: salesYear,
    },
  }

  const orders: { day: MetricCard; month: MetricCard; year: MetricCard } = {
    day: {
      formattedValue: formatNumber(ordersDay),
      value: ordersDay,
      percentage: 8.5,
    },
    month: {
      formattedValue: formatNumber(ordersMonth),
      value: ordersMonth,
    },
    year: {
      formattedValue: formatNumber(ordersYear),
      value: ordersYear,
    },
  }

  const views: { day: MetricCard; month: MetricCard; year: MetricCard } = {
    day: {
      formattedValue: formatNumber(viewsDay),
      value: viewsDay,
      percentage: -5.3,
    },
    month: {
      formattedValue: formatNumber(viewsMonth),
      value: viewsMonth,
    },
    year: {
      formattedValue: formatNumber(viewsYear),
      value: viewsYear,
    },
  }

  const averageTicket: {
    day: MetricCard
    month: MetricCard
    year: MetricCard
  } = {
    day: {
      formattedValue: formatCurrency(avgTicketDay),
      value: avgTicketDay,
      percentage: 12.1,
    },
    month: {
      formattedValue: formatCurrency(avgTicketMonth),
      value: avgTicketMonth,
    },
    year: {
      formattedValue: formatCurrency(avgTicketYear),
      value: avgTicketYear,
    },
  }

  const referenceForWeeks = new Date(year, month - 1, 15)
  const weeklySales = buildWeeklySales(referenceForWeeks, 4)
  const hourlySalesByDay = buildHourlySales(5)
  const monthlyMetrics = buildMonthlyMetrics(year)

  return {
    type: "1",
    message: "Success",
    data: {
      metrics: {
        sales,
        orders,
        views,
        averageTicket,
        weeklySales,
        hourlySalesByDay,
        monthlyMetrics,
      },
    },
  }
}


