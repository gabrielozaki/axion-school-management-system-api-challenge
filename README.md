## Changelist

- **Forcing code standards by using Eslint + Prettier + Airbnb guidelines**  
  *Why:* Guarantees that all developers follow the same guidelines, making it easier to maintain and onboard new developers.
  **Eslint v8.x is EOL, but Airbnb is still working to [update it to v9](https://github.com/airbnb/javascript/issues/2961)


- **Husky + Commitizen**  
  *Why:* Husky helps enforce linting during commits, and with the help of Commitizen, we can ensure standardized commit messages, making it easier to integrate with `semantic-release`.


- **Semantic Release**  
  *Why:* Automates versioning, changelogs, and package publishing, reducing manual work and human errors. [Read more](https://github.com/semantic-release/semantic-release).


- **Migrating from CommonJS to ESModules**  
  *Why:* Follows the more modern Node.js standard, makes the code easier to read, and improves integration with IDEs.


- **Replacing the files (`config/envs/*.js`) with environment variables (`.env`)**  
  *Why:* We should avoid exposing configurations in files, as described in the [12 Factor App](https://12factor.net/config).  
  Environment variables should be managed at the infrastructure level, as demonstrated in this [ECS example in Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_task_definition#example-using-container_definitions-and-inference_accelerator) (*search for "environment"*).  
  **This maintains compatibility with the existing project structure while improving security and environment configuration management.**


- **Replacing `console.log` by `winstor`**  
  *Why:* This allows us to have formated logs, with centralized configuration and give us the possibility of exporting to elastic stack


- **Replacing `aeon-machine` by `bull`**  
  *Why:* Aeon was not being updated in the last few months leading to some failure when cortex was updates, so changing it for Bull makes sense because it is a more robust way to schedule tasks, it uses queues on redis so can distribute between multiple application instances without having to rely on ion-cortex, reducing the complexity of the TimeMachine class
