type CommandArguments = {
  type: string;
  start: string;
  end: string;
  destination: string;
  headless: boolean;
  verbose: boolean;
};

export default function main(params: CommandArguments): Promise<any>;
