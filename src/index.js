'use strict'

import qs from 'querystring'
import axios from 'axios'
import _ from 'lodash'
import rateLimit from 'rate-limit-promise'
import dbg from 'debug'

const debug = dbg('CDO')

class CDO {
  constructor (token, opts={}) {
    this.token = token
    this.opts = _.merge({}, opts)
    this.secondLimiter = rateLimit(5, 1000 + CDO.RATE_LIMIT_EPSILON_MS)
    this.dayLimiter = rateLimit(1000, 1000*60*60*24 + CDO.RATE_LIMIT_EPSILON_MS)
  }

  datasets (params={}, config={}) { return this.request('datasets', {params, ...config}) }
  dataset (id, config={}) { return this.request(`datasets/${id}`, config) }

  datacategories (params={}, config={}) { return this.request('datacategories', {params, ...config}) }
  datacategory (id, config={}) { return this.request(`datacategories/${id}`, config) }

  datatypes (params={}, config={}) { return this.request('datatypes', {params, ...config}) }
  datatype (id, config={}) { return this.request(`datatypes/${id}`, config) }

  locationcategories (params={}, config={}) { return this.request('locationcategories', {params, ...config}) }
  locationcategory (id, config={}) { return this.request(`locationcategories/${id}`, config) }

  locations (params={}, config={}) { return this.request('locations', {params, ...config}) }
  location (id, config={}) { return this.request(`locations/${id}`, config) }

  stations (params={}, config={}) { return this.request('stations', {params, ...config}) }
  station (id, config={}) { return this.request(`stations/${id}`, config) }

  data (params={}, config={}) { return this.request('data', {params, ...config}) }

  all (method/*, params={}*/, ...args/*, iteratee */) {
    let iteratee = args.pop()
    let params = args.shift() || {}
    if (typeof method === 'string') method = _.get(this, method)
    return method.call(this, params, ...args).then(res => (
      Promise.resolve(iteratee(res)).then(done => {
        if (done) return res
        let nextParams = this.constructor.paramsForNextPage(_(res.metadata.resultset)
          .pick('offset', 'limit')
          .defaults(params)
          .value())
        if (params.offset >= res.metadata.resultset.count - params.limit) return null
        return this.all(method, nextParams, ...args, iteratee)
      })
    ))
  }

  static paramsForNextPage (currentPageParams) { return CDO._paramsForSiblingPage(currentPageParams, 'next') }
  static paramsForPrevPage (currentPageParams) { return CDO._paramsForSiblingPage(currentPageParams, 'prev') }
  static _paramsForSiblingPage (currentPageParams={}, direction) {
    let {offset, limit=this.DEFAULT_LIMIT} = currentPageParams
    if (typeof offset !== 'number' || offset < 0) offset = 0
    else offset = {
      next: offset + limit,
      prev: offset - limit
    }[direction]
    return _.defaults({offset, limit}, currentPageParams)
  }

  request (resource, config={}) {
    let mergedConfig = _.merge({
      baseURL: 'http://www.ncdc.noaa.gov/cdo-web/api/v2/',
      headers: {token: this.token}
    }, this.opts.config, {params: this.opts.params}, config)
    let params = mergedConfig.params || {}
    ;['startdate', 'enddate'].forEach(prop => {
      if (prop in params) params[prop] = CDO.formatDate(params[prop])
    })
    let readableURL = `/${resource}${_.isEmpty(params)?'':' '}${qs.stringify(params)}`
    return Promise
      .all([this.secondLimiter(), this.dayLimiter()])
      .then(() => axios(resource, mergedConfig))
      .catch(res => {
        let {status, statusText} = res
        debug(`%s (%s %s)`, readableURL, status, statusText)
        if (status === 429) return this.request.apply(this, arguments) // rate limited, try again
        throw res
      })
      .then(({status, statusText, data}) => {
        debug(`%s (%s %s)`, readableURL, status, statusText)
        return data
      })
  }

  static formatDate (date) {
    if (typeof date === 'string') return date
    date = new Date(date)
    return `${date.getUTCFullYear()}-${CDO._formatDatePart(date.getUTCMonth()+1)}-${CDO._formatDatePart(date.getUTCDate())}`
  }
  static _formatDatePart (part) {
    return _.padStart(part, 2, '0')
  }
}
CDO.RATE_LIMIT_EPSILON_MS = 200
CDO.DEFAULT_LIMIT = 25

module.exports = CDO
