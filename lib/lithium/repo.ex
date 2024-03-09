defmodule Lithium.Repo do
  use Ecto.Repo,
    otp_app: :lithium,
    adapter: Ecto.Adapters.SQLite3
end
