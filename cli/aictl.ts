// import { randCompanyName } from '@ngneat/falso'
// import { Command } from 'commander'
// import { validate as uuidValidate } from 'uuid'
//
// import { getError } from '@/lib/utils'
// import { confirm, input, select } from '@inquirer/prompts'
// import promiseMapLimit from 'promise-map-limit'
// import runAnsaMerchantSetup from './commands/ansaMerchantSetup'
// import runUserCreation from './commands/createUser'
// import runUserDeletion from './commands/deleteUserByEmail'
// import linkMerchant from './commands/linkMerchant'
// import { errorLog, infoLog, requireEnvVars, successLog } from './utils'
//
// // dashctl is a cli for our portal
// // Use it to help setup local dev
// const program = new Command()
//
// program
//   .command('create-user')
//   .description('Create a user')
//   .action(async () => {
//     const email = await input({ message: 'User Email?' })
//     const isSuperadmin = await confirm({ message: 'Is this a superadmin?' })
//     const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
//       requireEnvVars('SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL')
//     try {
//       await runUserCreation({
//         email: email!,
//         supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//         supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//         opts: {
//           isSuperadmin,
//         },
//       })
//
//       successLog('done')
//     } catch (err) {
//       errorLog(getError(err).message)
//     }
//   })
//
// program
//   .command('delete-user')
//   .description('Delete user by email')
//   .action(async () => {
//     const email = await input({ message: 'Email for user to delete?' })
//     const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
//       requireEnvVars('SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL')
//     try {
//       await runUserDeletion({
//         email: email!,
//         supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//         supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//       })
//
//       successLog('done')
//     } catch (err) {
//       errorLog(getError(err).message)
//     }
//   })
//
// program
//   .command('setup-test-merchant')
//   .option('-e, --email <email>', 'Email of user to create')
//   .option('-s, --isSuperadmin', 'Is this a superadmin?')
//   .option('-n, --numCustomers <number>', 'Number of customers to create')
//   .option('-m, --isSandboxMode', 'Is this merchant in sandbox mode?')
//   .option('-p, --psp', 'Which PSP to use? stripe or square')
//   .description(
//     'Seed db with merchant info and associate superadmin with merchant'
//   )
//   .action(async (options) => {
//     const email =
//       options.email || (await input({ message: 'User Email to create?' }))
//
//     const psp =
//       options.psp ||
//       (await select<'stripe' | 'square'>({
//         message: 'Which PSP to use?',
//         choices: [
//           {
//             name: 'stripe',
//             value: 'stripe',
//             description: 'Stripe psp',
//           },
//           {
//             name: 'square',
//             value: 'square',
//             description: 'Square psp',
//           },
//         ],
//       }))
//     const isSuperadmin =
//       !!options.isSuperadmin ||
//       (await confirm({ message: 'Is this a superadmin?' }))
//     const isSandboxMode =
//       !!options.isSandboxMode ||
//       (await confirm({ message: 'Is this sandbox mode?' }))
//
//     const customersToCreateStr =
//       options.numCustomers ||
//       (await input({ message: '# customers to create?' }))
//
//     const customersToCreate = parseInt(customersToCreateStr, 10)
//     if (isNaN(customersToCreate) || customersToCreate < 1) {
//       errorLog('Invalid number of customers')
//       return
//     }
//     const {
//       SUPABASE_SERVICE_ROLE_KEY,
//       NEXT_PUBLIC_SUPABASE_URL,
//       ANSA_HOST,
//       ANSA_ADMIN_API_KEY,
//     } = requireEnvVars(
//       'SUPABASE_SERVICE_ROLE_KEY',
//       'NEXT_PUBLIC_SUPABASE_URL',
//       'ANSA_HOST',
//       'ANSA_ADMIN_API_KEY'
//     )
//     try {
//       infoLog(`Setting up user: ${email}. Is superadmin: ${isSuperadmin}?...`)
//       const userUUID = await runUserCreation({
//         email,
//         supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//         supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//         opts: { isSuperadmin },
//       })
//       infoLog(`Setting up merchant...`)
//       await runAnsaMerchantSetup({
//         userUUID,
//         isSuperadmin,
//         supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//         supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//         ansaHost: ANSA_HOST!,
//         ansaAdminApiKey: ANSA_ADMIN_API_KEY!,
//         merchantsToCreate: [randCompanyName()],
//         customersToCreate,
//         isSandboxMode,
//         psp,
//       })
//     } catch (err) {
//       errorLog(getError(err).message, err)
//     }
//   })
//
// /**
//  * This script initializes all superadmin entities
//  * By creating the user, the merchant, linking the merchant to the user,
//  * and setting the superadmin role
//  **/
// program
//   .command('initialize_superadmins')
//   .description('Initialize ansa superadmins')
//   .option('-n, --merchant_name <name>', 'Ansa merchant name to link to')
//   .option('-u, --merchant_uuid <uuid>', 'Ansa merchant uuid to link to')
//   .option(
//     '-k, --merchant_secret_key <key>',
//     'Ansa merchant secret key to link to'
//   )
//   .action(async (options) => {
//     const ansa_merchant_secret_key =
//       options.merchant_secret_key ||
//       (await input({ message: 'Merchant Secret Key?' }))
//
//     if (!ansa_merchant_secret_key) {
//       errorLog('Merchant Secret Key is required')
//       return
//     }
//     const ansa_merchant_name =
//       options.merchant_name || (await input({ message: 'Merchant Name?' }))
//     if (!ansa_merchant_name) {
//       errorLog('Merchant Name is required')
//       return
//     }
//     const ansa_merchant_uuid =
//       options.merchant_uuid || (await input({ message: 'Merchant UUID?' }))
//     if (!ansa_merchant_uuid) {
//       errorLog('Merchant UUID is required')
//       return
//     }
//
//     if (!uuidValidate(ansa_merchant_uuid)) {
//       errorLog('Merchant UUID is not valid')
//       return
//     }
//     const admins = [
//       'justin@getansa.com',
//       'sides@getansa.com',
//       'tony@getansa.com',
//       'jt@getansa.com',
//       'hank@getansa.com',
//       'nick@getansa.com',
//       'justin@getansa.dev',
//       'sides@getansa.dev',
//       'tony@getansa.dev',
//       'jt@getansa.dev',
//       'hank@getansa.dev',
//       'nick@getansa.dev',
//     ]
//
//     const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
//       requireEnvVars(
//         'SUPABASE_SERVICE_ROLE_KEY',
//         'NEXT_PUBLIC_SUPABASE_URL',
//         'ANSA_HOST',
//         'ANSA_ADMIN_API_KEY'
//       )
//     try {
//       infoLog(`Setting up superadmins: ${admins.join(', ')}`)
//       await promiseMapLimit(admins, 1, async (email) => {
//         infoLog(`Setting up superadmin: ${email}`)
//         await runUserCreation({
//           email,
//           supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//           supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//           opts: { isSuperadmin: true },
//         })
//
//         await linkMerchant({
//           email,
//           supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//           supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//           merchantData: {
//             ansa_merchant_uuid,
//             ansa_merchant_name,
//           },
//           merchantKeyData: {
//             ansa_merchant_secret_key,
//           },
//         })
//       })
//       successLog(`Done setting up superadmins`)
//     } catch (err) {
//       errorLog(getError(err).message)
//     }
//   })
//
// /**
//  * This script initializes a merchant user
//  * By creating the user + linking the merchant to the user.
//  **/
// program
//   .command('initialize_merchant_user')
//   .description('Initialize ansa merchant user')
//   .option('-e, --email <email>', 'Email of user to create')
//   .option('-n, --merchant_name <name>', 'Ansa merchant name to link to')
//   .option('-u, --merchant_uuid <uuid>', 'Ansa merchant uuid to link to')
//   .option(
//     '-k, --merchant_secret_key <key>',
//     'Ansa merchant secret key to link to'
//   )
//   .action(async (options) => {
//     const email =
//       options.email || (await input({ message: 'User Email to create?' }))
//
//     if (!email) {
//       errorLog('User Email is required')
//       return
//     }
//     const ansa_merchant_secret_key =
//       options.merchant_secret_key ||
//       (await input({ message: 'Merchant Secret Key?' }))
//
//     if (!ansa_merchant_secret_key) {
//       errorLog('Merchant Secret Key is required')
//       return
//     }
//     const ansa_merchant_name =
//       options.merchant_name || (await input({ message: 'Merchant Name?' }))
//     if (!ansa_merchant_name) {
//       errorLog('Merchant Name is required')
//       return
//     }
//     const ansa_merchant_uuid =
//       options.merchant_uuid || (await input({ message: 'Merchant UUID?' }))
//     if (!ansa_merchant_uuid) {
//       errorLog('Merchant UUID is required')
//       return
//     }
//
//     if (!uuidValidate(ansa_merchant_uuid)) {
//       errorLog('Merchant UUID is not valid')
//       return
//     }
//     const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
//       requireEnvVars(
//         'SUPABASE_SERVICE_ROLE_KEY',
//         'NEXT_PUBLIC_SUPABASE_URL',
//         'ANSA_HOST',
//         'ANSA_ADMIN_API_KEY'
//       )
//     try {
//       infoLog(`Setting up merchant user: ${email}`)
//       await runUserCreation({
//         email,
//         supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//         supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//         opts: { isSuperadmin: false },
//       })
//
//       await linkMerchant({
//         email,
//         supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
//         supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
//         merchantData: {
//           ansa_merchant_uuid,
//           ansa_merchant_name,
//         },
//         merchantKeyData: {
//           ansa_merchant_secret_key,
//         },
//       })
//       successLog(`Done setting up merchant user`)
//     } catch (err) {
//       errorLog(getError(err).message)
//     }
//   })
//
// program.parse(process.argv)
