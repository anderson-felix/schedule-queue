class FakeConnection {

  async updateUser(user) {

    return new Promise(res => {
      setTimeout(() => {
        console.log(`${user?.name} updated!`)
        res(user)
      }, 250)
    })
  }
}

module.exports = FakeConnection;