require 'sys/filesystem'
require 'pathname'
require 'json'
#
# 仮想マシン内部におけるキャッシュの管理を行います
#
class LocalCacheStorage
  # キャッシュストレージをマウントしているパス
  DEFAULT_CACHE_MOUNT_POINT = '/opt/cache'.freeze

  # パラメータに与えられたパスの情報を取得して連想配列を返します
  # === Args
  # mount_point :: キャッシュを保存するストレージのマウントポイント.初期値に LocalCacheStorage::DEFAULT_CACHE_MOUNT_POINT が利用される
  # === Return
  # {storage: {limit_mb: "キャッシュ保存領域の最大容量(MB)", used_md: "キャッシュ保存領域の使用済み容量"  }, top_level_files: "キャッシュディレクトリの最上位層のファイル一覧を json 文字列にしたもの"  }
  def self.stat(mount_point: DEFAULT_CACHE_MOUNT_POINT)
    stat = Sys::Filesystem.stat(Pathname.new(mount_point).to_s)
    limit = stat.block_size * stat.blocks
    used = stat.block_size * (stat.blocks - stat.blocks_free)
    {
      storage: {
        limit_mb: limit / 1024 / 1024, # MBに単位を変換
        used_mb: used / 1024 / 1024
      },
      top_level_files: top_level_files(mount_point).to_json
    }
  end

  def self.top_level_files(path)
    base = Pathname.new(path)
    go = lambda do |tree, node|
      relative = node.relative_path_from(base)
      file = {
        name: relative.basename.to_s,
        path: relative.to_s
      }
      tree << file
      tree
    end
    tree = []
    files = Dir.glob("#{base}/*", File::FNM_DOTMATCH).delete_if do |e|
      Pathname(e).basename.to_s == '.' || Pathname(e).basename.to_s == '..'
    end
    files.each do |e|
      go.call(tree, Pathname.new(e))
    end
    tree
  end
end
