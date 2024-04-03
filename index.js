

async function sc(connect, t) {
  return await connect
}
let numberConnection = 0
class Connection {
 
  constructor(connection, save, downloadInfo) {
    this.connectNumber = numberConnection
    numberConnection++
    this.connection = connection;
    this.save = save;
    this.downloadInfo = downloadInfo;
  }

  async start() {
    const { connection, save, downloadInfo, connectNumber } = this;
    const { download, close } = connection
    //console.log('start', { connectNumber})
    while(downloadInfo.pending.length > 0) {
      const url = downloadInfo.pending.pop()
      //console.log({url})
      await download(url)
        .then((result) => save(result))
        .catch((e) => {
          //console.log(e)
          close() 
          throw e
        })
    }
    close()
    //console.log('end', { connectNumber})
  }

}

const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  //console.log({downloadList: downloadList.length, maxConcurrency})
  let downloadInfo = { pending: [...downloadList], connectionsOpens: 0 }
  
  const createdConnection = async (c, i) => {
    //console.log("createdConnection "+i)
    downloadInfo.connectionsOpens = i
    const connectedPool = [new Connection(c, save, downloadInfo)]
    try {
      if (i < maxConcurrency) {
        const c = await connect()
        connectedPool.push(...await createdConnection(c, i+1))
      } 
    } catch(e) {
      //console.log({e})
      //connectedPool.push(Promise.reject(new Error('connection failed')))
    }
    return connectedPool
  }

  return connect()
    .catch(e => { throw new Error('connection failed' ) })
    .then(async c => {
      connections = await createdConnection(c, 1)
      return Promise.allSettled(connections.map(c => c.start()))
        .then((values) => {
          //console.log(values)
          const error = values.find((v) => v.status === 'rejected')
          if(error) throw error.reason
        })
    })
}

module.exports = pooledDownload
