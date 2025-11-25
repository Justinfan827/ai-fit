import { Command } from "commander"

// dashctl is a cli for our portal
// Use it to help setup local dev
const program = new Command()

program
  .command("create-user")
  .option("-e, --email <email>", "Email of user to create")
  .option("-p, --password <password>", "Password of user to create")
  .option("-f, --first <first>", "First name of user to create")
  .option("-l, --last <last>", "Last name of user to create")
  .description("Create a user")
  .action(() => {
    // TODO: Implement
  })
