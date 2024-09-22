const numberFormats = {
   'en-US': {
      currency: {
         style: 'currency',
         currency: 'USD',
         notation: 'standard',
      },
      decimal: {
         style: 'decimal',
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      },
      percent: {
         style: 'percent',
         useGrouping: false,
      },
   },
   'ja-JP': {
      currency: {
         style: 'currency',
         currency: 'JPY',
         useGrouping: true,
         currencyDisplay: 'symbol',
      },
      decimal: {
         style: 'decimal',
         minimumSignificantDigits: 3,
         maximumSignificantDigits: 5,
      },
      percent: {
         style: 'percent',
         useGrouping: false,
      },
   },
}

export default numberFormats
