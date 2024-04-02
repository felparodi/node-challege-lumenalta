

const pooledDownload = (connect, save, downloadList, maxConcurrency) => {
  //console.log({downloadList: downloadList.length, maxConcurrency})
  let pendingDownload = [...downloadList]
  const connectPool = []
  const closeConnectionList = [];
    for(let i = 0; i  < downloadList.length && i < maxConcurrency; i++) {
      //console.log({ 'startI': i })
      const connectPoolItem = connect()
        .catch((e) => {  
          //console.log(e)
          throw new Error('connection failed') 
        })
        .then(async (connection) => {
          //console.log('startPool '+i)
          const { download, close } = connection
          closeConnectionList.push(close)
          while(pendingDownload.length > 0) {
            //console.log({ 'pool': i, 'pendingDownload': pendingDownload.length})
            await download(pendingDownload.pop())
              .then((result) => save(result))
              .catch((e) => { 
                throw e
              })
            //console.log( 'pool '+ i + ' end')
          }
          close()
      })
      connectPool.push(connectPoolItem);
      //console.log({ 'connectPoolLength': connectPool.length })
    }    
  //console.log({connectPool: connectPool.length})
  return Promise.all(connectPool)
    .catch((e) => {
      try {
        closeConnectionList.forEach(c => c())
      } catch {}
      throw e
    })
}

module.exports = pooledDownload
