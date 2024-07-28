import { getDataSource } from "./AppDataSource"
import { SavedRoll } from "./entities/SavedRoll.entity"

export class DiscordBotDao{

    async basicTest(){
        
        const AppDataSource = await getDataSource();

        const roll = new SavedRoll()
        roll.interaction = JSON.stringify({})
        roll.result = JSON.stringify({})
        roll.userId = '417299509517877248'

        await AppDataSource.manager.save(roll)

        const allRolls = await SavedRoll.find()
        console.log(allRolls)
        const firstRoll = await SavedRoll.findOneBy({
            id: 1,
        })
        const myRoll = await SavedRoll.findOneBy({
            userId: '417299509517877248'
        })

        if(myRoll){
            await myRoll.remove()
        }
    }

}