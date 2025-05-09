import moment from "moment"

const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss"

export const formatDate = (date) => moment(date).format(DATE_FORMAT)


export const getCurrentDate = () => moment().format(DATE_FORMAT)
